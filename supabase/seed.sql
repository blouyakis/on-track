-- Local development seed, loaded by `npx supabase db reset`.
--
-- Until sign-up and sign-in exist (the auth feature), the app uses one
-- seeded contributor on one seeded project. The email and password below
-- are LOCAL-ONLY demo credentials: they exist only in a database built from
-- this file and protect nothing real. Never reuse them anywhere else, and
-- never run this file against a hosted project.

-- ---------------------------------------------------------------------------
-- Demo contributor (a real Supabase Auth user, so Row Level Security applies)
-- ---------------------------------------------------------------------------

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change,
  email_change_token_new
)
values (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-4111-8111-111111111111',
  'authenticated',
  'authenticated',
  'demo.contributor@ontrack.local',
  extensions.crypt('ontrack-local-demo', extensions.gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Demo Contributor"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
);

insert into auth.identities (
  id,
  user_id,
  provider_id,
  provider,
  identity_data,
  last_sign_in_at,
  created_at,
  updated_at
)
values (
  gen_random_uuid(),
  '11111111-1111-4111-8111-111111111111',
  '11111111-1111-4111-8111-111111111111',
  'email',
  jsonb_build_object(
    'sub', '11111111-1111-4111-8111-111111111111',
    'email', 'demo.contributor@ontrack.local',
    'email_verified', true
  ),
  now(),
  now(),
  now()
);

-- ---------------------------------------------------------------------------
-- Demo project, with the demo user as a contributor
-- ---------------------------------------------------------------------------

insert into public.projects (id, name, invite_code, created_by)
values (
  '22222222-2222-4222-8222-222222222222',
  'Demo Project',
  'DEMO-2026',
  '11111111-1111-4111-8111-111111111111'
);

insert into public.memberships (project_id, user_id, role, planned_hours)
values (
  '22222222-2222-4222-8222-222222222222',
  '11111111-1111-4111-8111-111111111111',
  'contributor',
  40
);

-- ---------------------------------------------------------------------------
-- Sample entries on different dates, so "newest first" is visible
-- ---------------------------------------------------------------------------

insert into public.entries (
  project_id, author_id, entry_date, hours, type, details, link,
  attendees, decisions, action_items
)
values
  (
    '22222222-2222-4222-8222-222222222222',
    '11111111-1111-4111-8111-111111111111',
    '2026-11-10', 1.00, 'meeting',
    'Kickoff meeting to agree on scope.',
    null,
    'Demo Contributor, teammate',
    'Use Supabase for the database and auth.',
    'Draft the schema before Friday.'
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    '11111111-1111-4111-8111-111111111111',
    '2026-11-12', 2.50, 'work',
    'Wrote the initial schema migration.',
    'https://github.com/blouyakis/on-track/pull/6',
    null, null, null
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    '11111111-1111-4111-8111-111111111111',
    '2026-11-14', 0.50, 'admin',
    'Set up the project board.',
    null,
    null, null, null
  );
