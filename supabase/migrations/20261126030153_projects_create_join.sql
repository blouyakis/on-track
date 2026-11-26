-- Creating a project and joining one by invite code.
--
-- Both go through a function, not through a direct insert. Joining has to
-- find a project by its code, and a user who is not a member yet can read no
-- project at all under Row Level Security, so the lookup has to run as the
-- functions' owner. Creating uses a function too, so that the project and
-- its overseer membership are written together and the invite code is made
-- here, where a caller cannot choose it.
--
-- The functions take the user from the session (auth.uid()). They accept no
-- user id and no role, so a caller cannot act as someone else or pick a role.
--
-- The tables stay closed: `authenticated` still has no insert, update or
-- delete privilege on projects or memberships, and Row Level Security stays
-- on. These functions are the only way to write to them through the API.
--
-- Server code checks the same rules through src/lib/ (project-name.ts,
-- invite-code.ts, visibility.ts) before it calls these.

-- ---------------------------------------------------------------------------
-- Invite codes
-- ---------------------------------------------------------------------------

-- Ten random characters, shown as XXXXX-XXXXX. The alphabet has 32 symbols
-- and leaves out 0, O, 1 and I, which are easy to mix up when a code is read
-- aloud or copied by hand. 32 divides 256, so every symbol is equally likely.
create function private.new_invite_code()
returns text
language sql
volatile
set search_path = ''
as $$
  select string_agg(
    substr(
      'ABCDEFGHJKLMNPQRSTUVWXYZ23456789',
      (get_byte(r.bytes, i) % 32) + 1,
      1
    ) || case when i = 4 then '-' else '' end,
    ''
    order by i
  )
  from (select extensions.gen_random_bytes(10) as bytes) as r,
    generate_series(0, 9) as i
$$;

revoke all on function private.new_invite_code() from public;

-- ---------------------------------------------------------------------------
-- Creating a project
-- ---------------------------------------------------------------------------

-- Creates the project and makes the caller its overseer. Returns the new
-- project's id.
create function public.create_project(p_name text)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_name text := btrim(coalesce(p_name, ''), E' \t\n\r');
  v_project_id uuid;
begin
  if v_user_id is null then
    raise exception 'Sign in to create a project.' using errcode = '28000';
  end if;

  -- The same limits as src/lib/project-name.ts.
  if v_name = '' or char_length(v_name) > 100 then
    raise exception 'A project name must be 1 to 100 characters.'
      using errcode = '22023';
  end if;

  -- A new code matching an existing one is very unlikely; try again if it
  -- happens, and give up after a few attempts instead of looping forever.
  for attempt in 1..5 loop
    begin
      insert into public.projects (name, invite_code, created_by)
      values (v_name, private.new_invite_code(), v_user_id)
      returning id into v_project_id;
      exit;
    exception
      when unique_violation then
        v_project_id := null;
    end;
  end loop;

  if v_project_id is null then
    raise exception 'Could not make an invite code. Try again.';
  end if;

  insert into public.memberships (project_id, user_id, role)
  values (v_project_id, v_user_id, 'overseer');

  return v_project_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Joining a project
-- ---------------------------------------------------------------------------

-- Makes the caller a contributor of the project with this invite code and
-- returns the project's id. Returns null when no project has the code, and
-- says nothing else, so a wrong code reveals nothing about any project.
--
-- A user who is already a member keeps the role they have: an overseer who
-- enters their own code stays the overseer.
create function public.join_project(p_invite_code text)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  -- Codes are stored in upper case with no spaces (src/lib/invite-code.ts).
  v_code text := upper(regexp_replace(coalesce(p_invite_code, ''), '\s', '', 'g'));
  v_project_id uuid;
begin
  if v_user_id is null then
    raise exception 'Sign in to join a project.' using errcode = '28000';
  end if;

  select p.id
  into v_project_id
  from public.projects p
  where p.invite_code = v_code;

  if v_project_id is null then
    return null;
  end if;

  insert into public.memberships (project_id, user_id, role)
  values (v_project_id, v_user_id, 'contributor')
  on conflict (project_id, user_id) do nothing;

  return v_project_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Reading the invite code
-- ---------------------------------------------------------------------------

-- Sharing the invite code is the overseer's job (PRD, Roles), so only the
-- overseer can read it. Until now every member could select the column.
-- Members keep the other columns; the code is read through the function
-- below.
revoke select on public.projects from authenticated;
grant select (id, name, created_by, created_at)
  on public.projects to authenticated;

-- Returns the project's invite code to its overseer. Everyone else gets
-- null, whether they are a contributor, not a member, or the project does
-- not exist.
create function public.project_invite_code(p_project_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.invite_code
  from public.projects p
  where p.id = p_project_id
    and private.project_role(p_project_id) = 'overseer'
$$;

-- ---------------------------------------------------------------------------
-- Who may call the functions
-- ---------------------------------------------------------------------------

-- New functions in the public schema can be run by every API role unless
-- that is taken away. Signed-out visitors get none of these.
revoke all on function public.create_project(text) from public, anon;
revoke all on function public.join_project(text) from public, anon;
revoke all on function public.project_invite_code(uuid) from public, anon;

grant execute on function public.create_project(text) to authenticated;
grant execute on function public.join_project(text) to authenticated;
grant execute on function public.project_invite_code(uuid) to authenticated;
