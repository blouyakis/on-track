-- Creating a project, joining one by invite code, and who can read the code.
--
-- Run with `npx supabase test db` against the local stack. Everything here
-- happens in one transaction that is rolled back, so no data is left behind.
--
-- Each block signs in as one user the way the API does: the role becomes
-- `authenticated` and the user's id is the `sub` claim of the request.
-- `reset role` goes back to the database owner, who can see every row, to
-- check what was written.

begin;

create extension if not exists pgtap with schema extensions;

select plan(32);

-- Olivia creates the project, Carl joins it, and Sam never does.
insert into auth.users (id, email)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'olivia@ontrack.test'),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'carl@ontrack.test'),
  ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'sam@ontrack.test');

-- ---------------------------------------------------------------------------
-- Creating a project
-- ---------------------------------------------------------------------------

set local role anon;
set local request.jwt.claims to '{"role": "anon"}';

select throws_ok(
  $$ select public.create_project('Capstone') $$,
  '42501',
  null,
  'a signed-out visitor cannot create a project'
);

reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "role": "authenticated"}';

select lives_ok(
  $$ select public.create_project('  Capstone  ') $$,
  'a signed-in user can create a project'
);

reset role;

select is(
  (select count(*)::int from public.projects where name = 'Capstone'),
  1,
  'the project is saved once, with its name trimmed'
);

select is(
  (select created_by from public.projects where name = 'Capstone'),
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid,
  'the project records who created it, taken from the session'
);

select is(
  (
    select array_agg(m.user_id || ' ' || m.role)
    from public.memberships m
    join public.projects p on p.id = m.project_id
    where p.name = 'Capstone'
  ),
  array['aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa overseer'],
  'the creator is the project''s only member, as its overseer'
);

select matches(
  (select invite_code from public.projects where name = 'Capstone'),
  '^[A-HJ-NP-Z2-9]{5}-[A-HJ-NP-Z2-9]{5}$',
  'the project gets an invite code of ten unambiguous characters'
);

set local role authenticated;
set local request.jwt.claims to '{"sub": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "role": "authenticated"}';

select throws_ok(
  $$ select public.create_project('   ') $$,
  '22023',
  null,
  'a blank name is rejected'
);

select throws_ok(
  $$ select public.create_project(repeat('a', 101)) $$,
  '22023',
  null,
  'a name over 100 characters is rejected'
);

select lives_ok(
  $$ select public.create_project(repeat('a', 100)) $$,
  'a name of exactly 100 characters is accepted'
);

reset role;

select isnt(
  (select invite_code from public.projects where name = 'Capstone'),
  (select invite_code from public.projects where name = repeat('a', 100)),
  'two projects get different invite codes'
);

-- A known code and the project's id, for the rest of the file.
update public.projects set invite_code = 'TESTC-ODE22' where name = 'Capstone';
select set_config(
  'test.project_id',
  (select id::text from public.projects where name = 'Capstone'),
  true
);

-- ---------------------------------------------------------------------------
-- The tables cannot be written to directly
-- ---------------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims to '{"sub": "cccccccc-cccc-4ccc-8ccc-cccccccccccc", "role": "authenticated"}';

select throws_ok(
  $$
    insert into public.projects (name, invite_code, created_by)
    values ('Mine', 'MINE-0001', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc')
  $$,
  '42501',
  null,
  'a signed-in user cannot insert a project directly'
);

select throws_ok(
  $$
    insert into public.memberships (project_id, user_id, role)
    values (
      current_setting('test.project_id')::uuid,
      'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      'overseer'
    )
  $$,
  '42501',
  null,
  'a signed-in user cannot give themselves a membership directly'
);

-- ---------------------------------------------------------------------------
-- Joining a project
-- ---------------------------------------------------------------------------

reset role;
set local role anon;
set local request.jwt.claims to '{"role": "anon"}';

select throws_ok(
  $$ select public.join_project('TESTC-ODE22') $$,
  '42501',
  null,
  'a signed-out visitor cannot join a project'
);

reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub": "dddddddd-dddd-4ddd-8ddd-dddddddddddd", "role": "authenticated"}';

select is(
  public.join_project('WRONG-CODE9'),
  null::uuid,
  'an unknown code returns nothing'
);

select is(
  public.join_project(''),
  null::uuid,
  'an empty code returns nothing'
);

select is(
  public.join_project(null),
  null::uuid,
  'a missing code returns nothing'
);

select is(
  (select count(*)::int from public.projects),
  0,
  'after a wrong code, the user still reads no project at all'
);

reset role;

select is(
  (
    select count(*)::int
    from public.memberships
    where user_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
  ),
  0,
  'a wrong code adds no membership'
);

set local role authenticated;
set local request.jwt.claims to '{"sub": "cccccccc-cccc-4ccc-8ccc-cccccccccccc", "role": "authenticated"}';

select is(
  public.join_project(' testc-ode22 '),
  current_setting('test.project_id')::uuid,
  'a valid code returns the project, whatever its case or spacing'
);

reset role;

select is(
  (
    select role
    from public.memberships
    where user_id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
      and project_id = current_setting('test.project_id')::uuid
  ),
  'contributor',
  'joining makes the user a contributor'
);

set local role authenticated;
set local request.jwt.claims to '{"sub": "cccccccc-cccc-4ccc-8ccc-cccccccccccc", "role": "authenticated"}';

select is(
  public.join_project('TESTC-ODE22'),
  current_setting('test.project_id')::uuid,
  'joining a second time returns the same project'
);

select is(
  (
    select name
    from public.projects
    where id = current_setting('test.project_id')::uuid
  ),
  'Capstone',
  'a member can read the project''s name'
);

reset role;

select is(
  (
    select count(*)::int
    from public.memberships
    where user_id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
  ),
  1,
  'joining a second time adds no second membership'
);

set local role authenticated;
set local request.jwt.claims to '{"sub": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "role": "authenticated"}';

select is(
  public.join_project('TESTC-ODE22'),
  current_setting('test.project_id')::uuid,
  'the overseer can use their own code without an error'
);

reset role;

select is(
  (
    select role
    from public.memberships
    where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
      and project_id = current_setting('test.project_id')::uuid
  ),
  'overseer',
  'using their own code leaves the overseer an overseer'
);

-- ---------------------------------------------------------------------------
-- Who can read the invite code
-- ---------------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims to '{"sub": "cccccccc-cccc-4ccc-8ccc-cccccccccccc", "role": "authenticated"}';

select throws_ok(
  $$ select invite_code from public.projects $$,
  '42501',
  null,
  'a contributor cannot read the invite code column'
);

select is(
  public.project_invite_code(current_setting('test.project_id')::uuid),
  null,
  'a contributor gets no invite code from the function'
);

reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "role": "authenticated"}';

select throws_ok(
  $$ select invite_code from public.projects $$,
  '42501',
  null,
  'the column is closed to the overseer too; the function is the only way'
);

select is(
  public.project_invite_code(current_setting('test.project_id')::uuid),
  'TESTC-ODE22',
  'the overseer gets the project''s invite code'
);

reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub": "dddddddd-dddd-4ddd-8ddd-dddddddddddd", "role": "authenticated"}';

select is(
  public.project_invite_code(current_setting('test.project_id')::uuid),
  null,
  'a user with no membership gets no invite code'
);

select is(
  public.project_invite_code(gen_random_uuid()),
  null,
  'a project that does not exist gives the same empty answer'
);

reset role;
set local role anon;
set local request.jwt.claims to '{"role": "anon"}';

select throws_ok(
  $$ select public.project_invite_code(current_setting('test.project_id')::uuid) $$,
  '42501',
  null,
  'a signed-out visitor cannot ask for an invite code'
);

reset role;

select * from finish();

rollback;
