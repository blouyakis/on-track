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
npx supabase db reset  # applies the migrations in supabase/migrations/
```

Create `.env.local` in the repo root (see the next section), then:

```bash
npm run dev            # http://localhost:3000
```

Stop the local stack with `npx supabase stop`.

## Environment variables

Put these in `.env.local`. The file is ignored by git; never commit it.

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | The API URL printed by `npx supabase start` (or `npx supabase status`) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | The publishable key printed by the same command |

Both are safe to expose to the browser. Access to data is controlled by Row Level Security in the database, not by keeping these values secret.

## Commands

```bash
npm run dev          # development server
npm run build        # production build
npm test             # unit tests (Vitest)
npm run lint         # ESLint
npx tsc --noEmit     # type check
```

## Database

The schema lives in `supabase/migrations/`. Add a change with `npx supabase migration new <name>`, then run `npx supabase db reset` to rebuild the local database from all migrations.
