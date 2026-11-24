# OnTrack

A shared contribution log for teams. Overseers create projects and share an invite code; Contributors join and log entries (date, hours, type, details, optional link). Built for CS6983 AI Coding, Fall 2026, Project 3.

The product spec is in [`docs/PRD.md`](docs/PRD.md). Conventions and the testing strategy are in [`CLAUDE.md`](CLAUDE.md).

## Tech stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Supabase (PostgreSQL and Auth), Vitest.

## Prerequisites

- Node 26 (see `.nvmrc`) and npm
- Docker Desktop, running, for the local Supabase stack

## Getting started

```bash
npm install
npx supabase start     # starts the local Supabase stack and prints its URL and keys
npx supabase db reset  # applies the migrations, then loads supabase/seed.sql
```

Create `.env.local` in the repo root (see the next section), then:

```bash
npm run dev            # http://localhost:3000
```

Stop the local stack with `npx supabase stop`.

### Demo sign-in (temporary)

Real sign-up and sign-in are not built yet. Until they are, the home page shows a **Continue as demo contributor** button when you are signed out. It signs in the demo user that `supabase/seed.sql` creates, a contributor on "Demo Project", so the form and the project log work under the real Row Level Security rules.

- The demo user exists only in a locally seeded database. If the button reports an error, run `npx supabase db reset`.
- The button is off in production builds unless `ALLOW_DEMO_SIGN_IN=true` is set. Do not set it on a deployment that holds real data.
- The session lasts about an hour, then the button appears again.

## Environment variables

Put these in `.env.local`. The file is ignored by git; never commit it.

| Variable                               | Value                                                                  |
| -------------------------------------- | ---------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | The API URL printed by `npx supabase start` (or `npx supabase status`) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | The publishable key printed by the same command                        |

Both are safe to expose to the browser. Access to data is controlled by Row Level Security in the database, not by keeping these values secret.

## Commands

```bash
npm run dev          # development server
npm run build        # production build
npm test             # unit tests (Vitest)
npm run test:coverage # unit tests with a coverage report in coverage/
npm run lint         # ESLint
npm run format       # format the code with Prettier
npm run format:check # check formatting without changing files (CI runs this)
npm run typecheck    # type check
```

## Database

The schema lives in `supabase/migrations/`. Add a change with `npx supabase migration new <name>`, then run `npx supabase db reset` to rebuild the local database from all migrations.

## Known issues

### Rejected entry posted before JavaScript loads shows a Next.js error in `next dev` ([#11](https://github.com/blouyakis/on-track/issues/11))

If the entry form is submitted before the page has hydrated (or with JavaScript off) and the server rejects the entry, `next dev` shows `InvariantError: Received an underlying cookies object that does not match either cookies or mutableCookies. This is a bug in Next.js.` Nothing is saved, and a reload recovers.

- **Only in development.** A production build (`npm run build` then `npm start`) re-renders the form with the server's error message as expected.
- **Cause (Next.js 16.4.6):** a form posted without JavaScript always re-renders the page, but Next.js leaves the request in its "action" phase when the action did not revalidate anything. `cookies()` then trips a dev-only check. A rejected `createEntry` returns early without calling `refresh()`, so it hits this path; a saved entry calls `refresh()` and does not.
- **Upstream:** reported as [vercel/next.js#101000](https://github.com/vercel/next.js/issues/101000) and [#101002](https://github.com/vercel/next.js/issues/101002), both closed without a fix.
- **Workaround:** none in the code. Test the no-JavaScript error path against a production build. Calling `refresh()` on rejected submissions would hide the error in dev, but it re-renders the page on every rejected submission, so we have not done it.
