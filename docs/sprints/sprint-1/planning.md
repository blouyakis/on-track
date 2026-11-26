# Sprint 1 planning

- **Dates:** 2026-11-23 to 2026-12-06
- **Roles this sprint:** Barbara develops. Ziye consumes: she reviews the PRs, tests the build, and owns the sprint's tooling.
- **Board:** https://github.com/users/blouyakis/projects/4
- **Milestones:** [Sprint 1](https://github.com/blouyakis/on-track/milestone/3) and [HW5: Custom Skill + MCP](https://github.com/blouyakis/on-track/milestone/2), both due Dec 6
- **Tracking issue:** [#19](https://github.com/blouyakis/on-track/issues/19)

## Goal

By Dec 6, OnTrack is a deployed app that real users can sign in to: a user can sign up, create a project or join one with an invite code, log entries, read the project log with filters under the visibility rules, and edit or delete their own entries. Every pull request runs the full pipeline (lint and format, type check, tests with coverage, build, audit, E2E, AI review, preview deploy), and a merge to `main` deploys to production. HW5 is submitted from the same work.

## Where we start

`main` has the HW4 work: the Supabase schema with Row Level Security (#2), the entry form and project log with a temporary demo sign-in (#3), the visibility rules as pure functions in `src/lib/visibility.ts` (#4), and CI with six required checks (#7). 81 tests pass.

Two Sprint 1 issues were finished before the sprint's first day ended:

- #26, Prettier check and coverage report in CI (PR #53, Ziye)
- #50, the `/log` skill for the communication log (PR #54, Ziye)

## Issues pulled in

### Application (Barbara)

| Issue | What | Priority | Depends on |
| --- | --- | --- | --- |
| #20 | Authentication: sign up, sign in and sign out | high | none |
| #21 | Projects: create, join by invite code, role per project | high | #20 |
| #22 | Project log: enforce the visibility rules and add filters | high | #21 |
| #23 | Entries: edit and delete your own entries | medium | none |
| #28 | Deploy: Vercel preview per pull request and production on merge | high | #20, hosted Supabase project |

### Tooling and tests (Ziye)

| Issue | What | Priority | Depends on |
| --- | --- | --- | --- |
| #24 | Hooks: format or lint on edit, and run tests on Stop | high | none |
| #25 | Playwright: E2E setup, first full path, and the CI stage | high | none |
| #14 | E2E test: rejected entry submitted without JavaScript | low | #25 |
| #27 | CI: AI review on pull requests | high | API key added as a GitHub secret (Barbara) |
| #29 | Writer/reviewer PR with a C.L.E.A.R. review | medium | one of Barbara's Sprint 1 PRs |
| #55 | Allow the new npm scripts in the Claude Code settings (added Nov 24) | low | none |

### Process (both)

| Issue | What | Priority |
| --- | --- | --- |
| #19 | This planning note, async standups and the retrospective | medium |

### HW5, in the same two weeks

HW5 is done as a pair; the split says who leads each part.

| Issue | What | Lead | Depends on |
| --- | --- | --- | --- |
| #15 | Custom skill `/add-feature`, v1 | Barbara | none |
| #16 | Run `/add-feature` on 2 real tasks and iterate to v2 | Barbara | #15, and uses #20 and #21 as the two tasks |
| #17 | Playwright MCP server integration | Ziye | none |
| #18 | HW5 retrospective and submission | both | #16, #17 |

## Order of work

Barbara's issues form a chain, so the order is mostly fixed by the dependencies above:

1. #15: write `/add-feature` v1, so the first two features can be built with it.
2. #20: authentication, as the skill's first real task.
3. #21: projects, as the skill's second real task.
4. #16: write v2 from what went wrong in the two runs.
5. #22, then #23.
6. #28: can start once #20 is merged, because a production deploy has no way to sign in before that (demo sign-in is off in production).

Ziye orders her own issues. Already agreed: #14 comes after #25 (communication log, entry 11).

## Dependencies and risks

- **#20 changes how the E2E tests sign in.** #25 and #14 are written against the seeded demo contributor, and #20 removes the demo sign-in button and `ALLOW_DEMO_SIGN_IN`. Whichever of #20 and #25 merges second has to adapt, so we say in the PRs which one that is.
- **Everything of Barbara's waits on #20.** If authentication slips, #21, #22, #28 and both skill runs for #16 slip with it. It is the first feature for that reason.
- **#27 needs a secret only Barbara can add.** Ziye asks for the API key when she reaches #27; Barbara adds it as a GitHub Actions secret and it appears nowhere in the repo.
- **#28 needs the hosted Supabase project** with the migrations applied, and its environment variables set in Vercel, not committed.
- **E2E tests run against a production build**, not `next dev`, because of the dev-only Next.js error recorded in #11.
- **HW5 and Sprint 1 end on the same day.** The HW5 evidence (two skill runs, the MCP task) comes from Sprint 1 work, so the session logs are saved in `docs/hw5/` as the work happens, not rebuilt at the end.

## How we work

- One branch per issue, named `<type>/<issue-number>-short-description`. Every change reaches `main` through a pull request that the other partner reviews.
- Review comments follow the C.L.E.A.R. framework. Every PR description has the AI disclosure: percent AI-generated, tool used, and what human review was applied.
- An issue is done when it meets the Definition of Done in `docs/PRD.md`: acceptance criteria met, tests written before the implementation and passing, lint and type check passing, no secrets in the code, inputs validated on the server, and the PR reviewed.
- Logic in `src/lib/` is written test-first, with `test:`, `feat:` and `refactor:` commits.

## Standups and the log

- Each of us posts at least 3 async standups during the sprint: what was completed, what is next, and any blocker.
- Each standup is an entry in `docs/communication-log.md` and its own file in `docs/sprints/sprint-1/standups/`, named `YYYY-MM-DD-name.md`. The `/log` skill writes both.
- Once OnTrack is deployed (#28), standups are also logged in OnTrack itself as `standup` entries.
- Every other meeting and async update between us goes in `docs/communication-log.md`.

## At the end of the sprint

- Retrospective saved as `docs/sprints/sprint-1/retrospective.md`.
- An export of the standups logged in OnTrack (screenshots or the PDF report) saved in `docs/sprints/sprint-1/`.
- Anything not finished is moved to Sprint 2 on the board, with a note on the issue saying why.
