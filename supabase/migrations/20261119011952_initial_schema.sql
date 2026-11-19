-- OnTrack initial schema: projects, memberships and entries.
--
-- Row Level Security is enabled on all three tables. The policies below
-- enforce the PRD's visibility rules in the database; server code enforces
-- the same rules through the functions in src/lib/.
--
-- Not covered here, and added with the features that need them:
--   - creating a project and joining one by invite code
--   - an overseer setting planned hours
-- Until those exist, only the database owner can write projects and
-- memberships.
--
-- Left to server validation (src/lib/), because the database cannot check
-- them well: the entry date not being in the future, and the link being a
-- valid URL.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) > 0),
  invite_code text not null unique,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);

-- Roles are per project: one row links one user to one project with a role.
create table public.memberships (
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references auth.users (id),
  role text not null check (role in ('contributor', 'overseer')),
  planned_hours numeric(7, 2) check (planned_hours >= 0),
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create index memberships_user_id_idx on public.memberships (user_id);

create table public.entries (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  author_id uuid not null references auth.users (id),
  entry_date date not null,
  hours numeric(4, 2) not null check (hours > 0 and hours <= 24),
  type text not null check (
    type in (
      'work',
      'admin',
      'meeting',
      'check_in',
      'standup',
      'async_update',
      'planning',
      'sprint_planning',
      'review',
      'retrospective',
      'other'
    )
  ),
  details text not null check (length(btrim(details)) > 0),
  link text,
  -- Used by the meeting-style types only.
  attendees text,
  decisions text,
  action_items text,
  created_at timestamptz not null default now(),
  -- The author must be a member of the entry's project.
  foreign key (project_id, author_id)
    references public.memberships (project_id, user_id)
);

-- The project log lists a project's entries newest first.
create index entries_project_date_idx
  on public.entries (project_id, entry_date desc, created_at desc);
create index entries_author_id_idx on public.entries (author_id);

-- ---------------------------------------------------------------------------
-- Membership lookup used by the policies
-- ---------------------------------------------------------------------------

-- Kept in a schema the API does not expose. It runs as its owner so that the
-- policy on memberships can look at memberships without recursing into itself.
create schema if not exists private;

create function private.project_role(p_project_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select m.role
  from public.memberships m
  where m.project_id = p_project_id
    and m.user_id = (select auth.uid())
$$;

revoke all on function private.project_role(uuid) from public;
grant usage on schema private to authenticated;
grant execute on function private.project_role(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.projects enable row level security;
alter table public.memberships enable row level security;
alter table public.entries enable row level security;

-- Signed-out visitors get nothing. Signed-in users get only what the
-- policies below allow.
revoke all on public.projects, public.memberships, public.entries
  from anon, authenticated;
grant select on public.projects, public.memberships to authenticated;
grant select, insert, update, delete on public.entries to authenticated;

-- A user with no membership in a project gets no data from it, including
-- its name.
create policy "Members can read their projects"
  on public.projects
  for select
  to authenticated
  using (private.project_role(id) is not null);

create policy "Members can read their project's memberships"
  on public.memberships
  for select
  to authenticated
  using (private.project_role(project_id) is not null);

-- Contributors and the overseer can read every entry in their project.
create policy "Members can read their project's entries"
  on public.entries
  for select
  to authenticated
  using (private.project_role(project_id) is not null);

-- Only contributors log entries, and only as themselves.
create policy "Contributors can add their own entries"
  on public.entries
  for insert
  to authenticated
  with check (
    author_id = (select auth.uid())
    and private.project_role(project_id) = 'contributor'
  );

-- A contributor can edit or delete only entries they created. The overseer
-- has no update or delete policy, so cannot change a contributor's entries.
create policy "Contributors can edit their own entries"
  on public.entries
  for update
  to authenticated
  using (
    author_id = (select auth.uid())
    and private.project_role(project_id) = 'contributor'
  )
  with check (
    author_id = (select auth.uid())
    and private.project_role(project_id) = 'contributor'
  );

create policy "Contributors can delete their own entries"
  on public.entries
  for delete
  to authenticated
  using (
    author_id = (select auth.uid())
    and private.project_role(project_id) = 'contributor'
  );
