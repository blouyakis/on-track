# Plan: Entry form and project log view (issue #3, HW4 Part 2)

Branch: `feature/3-entry-form-log` (based on `chore/2-supabase-setup`, PR #6 not merged yet).

## Context

Issue #3 asks for the first working slice of OnTrack: a contributor logs an entry and sees it in the project log, newest first. It must be built with the Explore, Plan, Implement, Commit workflow, in at least 3 commits that show the phases.

What the Explore phase found:

- `supabase/migrations/20261119011952_initial_schema.sql` revokes all access from `anon`, and every policy depends on `auth.uid()` through `private.project_role()`. A signed-out request can read and write nothing. Inserts also require `author_id = auth.uid()` and the role `contributor`.
- There is no `supabase/seed.sql`, although `supabase/config.toml` (`[db.seed]`) already loads it on `db reset`.
- `src/utils/supabase/server.ts` builds a cookie-based server client. It calls `cookies()`, which is a runtime API.
- `next.config.ts` has `cacheComponents: true`. Per the bundled docs (`08-caching.md`, `authentication-with-cache-components.md`), anything that reads cookies must render inside `<Suspense>`, must not use plain `use cache`, and Server Actions must re-check the user themselves. `07-mutating-data.md` gives `refresh()` from `next/cache` to re-render the page after a mutation; `02-guides/forms.md` gives the `useActionState` pattern for returning errors.
- `src/app/page.tsx` is still create-next-app boilerplate. `src/lib/` holds only a sanity test.
- Test tooling: Vitest, jsdom, React Testing Library. No `user-event` and no `jest-dom`; tests will use `fireEvent` and plain assertions so no dependency is added.

Decisions made (approved in Plan mode):

1. **Data access: dev sign-in.** The seed creates a real auth user. A temporary "Continue as demo contributor" button signs that user in through Supabase Auth. All reads and writes use the existing server client, so RLS stays fully enforced.
2. **Route: home page `/`.** The project is found from the signed-in user's membership on the server, never from the client.

## Scope

In: the form (five fields plus three meeting-style fields), required-field checks, saving, the log newest first, seed data, dev sign-in.

Out (later issues): the full validation rules (future date, hours range, URL format), edit and delete, log filters, real sign-up and sign-in, the overseer dashboard. Nothing from the PRD's out-of-scope list.

## Design

### 1. Seed data: `supabase/seed.sql` (new)

- One auth user (demo contributor) in `auth.users` and `auth.identities`, with a bcrypt password via `crypt()`, fixed UUID, email confirmed.
- One project ("Demo Project", fixed UUID, invite code).
- One membership: that user, that project, role `contributor`.
- Two or three sample entries on different dates so "newest first" is visible.
- The demo email and password are local-only credentials, labelled as such in a comment. They are not secrets of any real system, but they are committed; see Risks.

### 2. Pure logic in `src/lib/` (test first)

`src/lib/entry-types.ts`
- `ENTRY_TYPES`: the eleven PRD values in PRD order, `as const`; `EntryType` type.
- `ENTRY_TYPE_LABELS`: value to display label ("Check-in", "Async update", ...).
- `MEETING_STYLE_TYPES` and `isMeetingStyleType(type)`: true for meeting, check_in, standup, planning, sprint_planning, review, retrospective.
- `isEntryType(value: unknown)`: type guard used when parsing form data.

`src/lib/entry-required-fields.ts`
- `checkRequiredFields(input)` takes plain strings (`date`, `hours`, `type`, `details`) and returns `{ field, message }[]` for each one that is missing or blank. It returns a list and never throws. It only checks presence; the full rules are the Sprint 1 feature, which can replace or extend it.

`src/lib/sort-entries.ts`
- `sortNewestFirst(entries)`: by `entry_date` descending, then `created_at` descending. The query also orders this way; the function keeps the rule testable and guards the UI.

Tests in `src/lib/__tests__/` for each file, written and committed failing before the code.

### 3. Server side

`src/app/actions.ts` (new, `'use server'`)
- `signInAsDemoContributor()`: `createClient()` from `src/utils/supabase/server.ts`, `auth.signInWithPassword` with the seeded credentials, then `refresh()`. Refuses to run when `NODE_ENV === 'production'` unless `ALLOW_DEMO_SIGN_IN=true`, so it cannot be an open door on a real deployment by accident.
- `createEntry(prevState, formData)`:
  1. Get the user with `supabase.auth.getUser()`. No user: return an error state.
  2. Look up the user's membership on the server (`memberships` filtered by `user_id`). Require role `contributor`. The project id and author id come from this lookup and the session, never from the form.
  3. Read the form fields as strings, run `checkRequiredFields` and `isEntryType`. Errors: return them in state.
  4. Drop attendees, decisions and action items unless `isMeetingStyleType(type)`. Empty link becomes `null`.
  5. Insert into `entries`. A database error (for example a check constraint) returns a generic message; details go to the server log only.
  6. `refresh()` and return a success state so the form resets.

`src/app/page.tsx` (rewrite) and `src/app/layout.tsx` (title and description only)
- `Page` is synchronous and static: heading plus `<Suspense fallback=...>` around `<ProjectLog />`.
- `ProjectLog` (async Server Component, same file or `src/app/project-log.tsx`): gets the user; if none, renders the dev sign-in button. Otherwise loads the membership with its project name and the project's entries (`order entry_date desc, created_at desc`), passes them through `sortNewestFirst`, and renders `<EntryForm />` (contributors only) above `<EntryList />`.
- No `use cache`: the data is per user and must be fresh after each insert.

### 4. Components in `src/components/`

`entry-form.tsx` (`'use client'`)
- `useActionState(createEntry, initialState)`.
- Fields: date (`type="date"`), hours (`type="number"`, `step="0.25"`), type (`<select>` from `ENTRY_TYPES` and labels), details (`<textarea>`), link (`type="url"`, optional).
- Local state for the selected type; when `isMeetingStyleType`, also render attendees, decisions made and action items.
- HTML `required` on the four required fields for user experience; the server check is the real one. Errors from the action shown next to fields, with `aria-live`.
- Submit button disabled while pending.

`entry-list.tsx` (Server Component, no directive)
- One row per entry: date, type label, hours, details, link when present, and the three meeting fields when present. Empty state when there are no entries.

Styling with Tailwind utilities, page root `flex-1` per the layout note in CLAUDE.md.

### 5. Tests beyond `src/lib/`

- `src/components/__tests__/entry-form.test.tsx`: all five base fields render; the eleven types are options; meeting fields are hidden for `work` and shown after choosing `meeting`. The action module is mocked.
- `src/app/__tests__/actions.test.ts`: `createEntry` with `@/utils/supabase/server` and `next/cache` mocked at the boundary. Cases: no user returns an error and does not insert; missing details returns a field error and does not insert; a valid meeting entry inserts with `author_id` and `project_id` from the server lookup; a non-meeting entry drops the meeting fields.

## Commits (workflow phases)

1. `docs: add approved plan for entry form and project log` (Explore and Plan; this file copied to `docs/hw4/entry-form-log-plan.md`)
2. `chore: seed a demo project, contributor and entries`
3. `test: add failing tests for entry types and required fields`
4. `feat: add entry types and required-field check`
5. `test: add failing tests for newest-first ordering` then `feat: sort entries newest first` (may be two commits)
6. `test: add failing tests for the create-entry action and entry form`
7. `feat: add entry form, create-entry action and project log page`
8. `refactor:` only if cleanup is needed, with tests still green
9. `docs: add session log for HW4 Part 2` (after you export it)

`npm test`, `npm run lint` and `npx tsc --noEmit` run before every commit. Failing output is shown before each `feat:` commit.

## Session log steps (yours to run)

- `/compact` after commit 4 (pure logic green), keeping: issue #3, the branch, the two decisions above, and the remaining commits.
- Quit and resume once with `claude --continue` before commit 6 or 7.
- Export the session at the end; I will add it to `docs/hw4/` in commit 9.

## Verification

1. `npx supabase start`, then `npx supabase db reset` (applies the migration and `seed.sql`). **`db reset` wipes the local database; I will ask before running it.**
2. `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build` (the build confirms the page satisfies the Cache Components rules).
3. `npm run dev`, open `http://localhost:3000`:
   - Signed out: only the dev sign-in button; no project name or entries.
   - After sign-in: project name, seeded entries newest first.
   - Choose Meeting: the three extra fields appear; choose Work: they disappear.
   - Submit a valid entry: it appears at the top for its date without a manual reload.
   - Submit with details blank (bypassing the HTML check): the server returns the error and nothing is saved.
4. Confirm in the database that the new row has the seeded user as `author_id`.

## Risks and things I could not verify yet

- **Demo credentials in the repo.** They only exist in a locally seeded database, and the sign-in action is disabled in production by default. If you would rather keep them out of git, the alternative is reading them from `.env.local`, which needs two new variables documented in the README.
- **Vercel preview.** `seed.sql` runs only on local `db reset`. The preview deploy will show the signed-out state unless the hosted project is seeded and `ALLOW_DEMO_SIGN_IN=true` is set there. I plan to leave the preview signed out and say so in the PR, unless you want it seeded.
- **Session refresh.** There is no proxy refreshing tokens yet (it comes with the auth feature), so the demo session lasts about an hour, after which the button appears again.
- **`auth.users` seed columns.** Inserting an auth user by SQL depends on the local GoTrue version's required columns; I will confirm it by signing in after `db reset`, and fall back to creating the user with the Supabase admin API in a small script if it fails.
- README gets a short "Demo sign-in" note under Getting started.
