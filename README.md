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

### Signing in

Signed-out visitors are sent to `/sign-in`. From there you can:

- **Create an account** at `/sign-up` with an email and a password of at least 8 characters. A new account is not in a project yet, so its home page lists none until it creates or joins one.
- **Sign in as the seeded contributor** that `supabase/seed.sql` creates, a member of "Demo Project". Its email and password are in that file and exist only in a locally seeded database. If sign-in fails, run `npx supabase db reset`.

The local Supabase stack signs a new account in straight away. A Supabase project that confirms email addresses shows "Check your email to confirm your account, then sign in." instead.

### Projects

The home page lists the projects you belong to, with your role in each. Each project has its own page at `/projects/<id>`.

- **Create a project** from the home page. You become its overseer, and its page shows an invite code to share.
- **Join a project** by entering its invite code on the home page. You become a contributor.

Only the overseer sees a project's invite code. A project you are not a member of looks the same as one that does not exist.

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

## CI

GitHub Actions runs two workflows.

- **`ci.yml`** runs on every pull request and every push to `main`: lint and format check, type check, tests with coverage, build, and `npm audit`.
- **`ai-review.yml`** has Claude review the pull request and post its findings as PR comments (inline comments plus one summary). It reviews with the C.L.E.A.R. framework (Context, Logic, Evidence, Architecture, Risk), with the `CLAUDE.md` conventions filed under each letter, and labels each comment with [Conventional Comments](https://conventionalcomments.org/) plus its C.L.E.A.R. letter (for example `issue (blocking, Risk):`). It runs when a pull request is opened, reopened, or marked ready for review; drafts are skipped. To review again after new pushes, post a comment on the pull request that starts with `@claude review`. Only the repo owner, members, and collaborators can trigger it, and a new run cancels one still in progress for the same pull request. The comment trigger only works once the workflow is on `main`. Pull requests from forks are not reviewed, even on an `@claude review` comment, so open them from a branch in this repo.

The AI review needs an `ANTHROPIC_API_KEY` repository secret (Settings → Secrets and variables → Actions), which the repo owner adds. The key is never stored in the repo.

## Database

The schema lives in `supabase/migrations/`. Add a change with `npx supabase migration new <name>`, then run `npx supabase db reset` to rebuild the local database from all migrations. To apply a new migration without losing local data, run `npx supabase migration up`.

Database tests live in `supabase/tests/database/` and cover the rules the database enforces itself, such as who can create or join a project. Run them against the local stack with `npx supabase test db`. They run in a transaction that is rolled back, and they are not part of CI yet.

## Known issues

### Rejected entry posted before JavaScript loads shows a Next.js error in `next dev` ([#11](https://github.com/blouyakis/on-track/issues/11))

If the entry form is submitted before the page has hydrated (or with JavaScript off) and the server rejects the entry, `next dev` shows `InvariantError: Received an underlying cookies object that does not match either cookies or mutableCookies. This is a bug in Next.js.` Nothing is saved, and a reload recovers.

- **Only in development.** A production build (`npm run build` then `npm start`) re-renders the form with the server's error message as expected.
- **Cause (Next.js 16.4.6):** a form posted without JavaScript always re-renders the page, but Next.js leaves the request in its "action" phase when the action did not revalidate anything. `cookies()` then trips a dev-only check. A rejected `createEntry` returns early without calling `refresh()`, so it hits this path; a saved entry calls `refresh()` and does not.
- **Upstream:** reported as [vercel/next.js#101000](https://github.com/vercel/next.js/issues/101000) and [#101002](https://github.com/vercel/next.js/issues/101002), both closed without a fix.
- **Workaround:** none in the code. Test the no-JavaScript error path against a production build. Calling `refresh()` on rejected submissions would hide the error in dev, but it re-renders the page on every rejected submission, so we have not done it.
