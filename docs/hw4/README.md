# HW4: Claude Code Workflow & TDD — evidence index

OnTrack (CS6983 Project 3) · Barbara (Bobbi) Louyakis, Ziye Huang

This folder holds the evidence for HW4. Everything here was produced while
building OnTrack itself. The project-wide files it refers to live in the
repo root.

## Deliverables

| Deliverable | Where |
| --- | --- |
| P3 repository with CLAUDE.md and permissions configuration | [`/CLAUDE.md`](../../CLAUDE.md), [`/.claude/settings.json`](../../.claude/settings.json) |
| Feature code with TDD git history (red, green, refactor commits) | `src/lib/` and its `__tests__/`; commits listed under Part 3 |
| Annotated Claude Code session log | [`visibility-tdd-session-annotated.md`](visibility-tdd-session-annotated.md), [`entry-form-log-session-annotated.md`](entry-form-log-session-annotated.md) |
| Reflection (1–2 pages) | [`reflection.md`](reflection.md) |

## Part 1: Claude Code project setup (25%)

| Requirement | Evidence |
| --- | --- |
| Comprehensive CLAUDE.md | [`/CLAUDE.md`](../../CLAUDE.md): sections *Tech stack*, *Architecture decisions*, *Structure and conventions*, *Testing strategy*, *Do*, *Don't*, *Working sessions* |
| At least one `@import` | `@AGENTS.md` and `@docs/PRD.md` at the top of CLAUDE.md |
| Permissions configured | [`/.claude/settings.json`](../../.claude/settings.json) (commit `d0abf3b`): `allow` for tests, lint, type check, build and read-only git; `ask` for `git commit`, `git push`, `npm install`; `deny` for reading `.env` files, `git push --force` and `rm -rf`. Personal overrides go in `.claude/settings.local.json`, which is git-ignored (`6d2e8e1`). |
| Permissions shown working | [`permissions-session.txt`](permissions-session.txt), [`screenshots/permissions-session.png`](screenshots/permissions-session.png) (commit `b335fb9`); a denied `.env.example` read in [`entry-form-log-session-part1.txt`](entry-form-log-session-part1.txt) |
| `/init` output | [`init-session.txt`](init-session.txt) (commit `c700ee5`); generated file committed as is in `a7741f9` |
| Iterating on CLAUDE.md after `/init` | `a7741f9` (`/init`, 38 lines: commands, structure) → `a25082d` (rewrite adding stack, architecture decisions, conventions, testing strategy, do's and don'ts). Compare with `git diff a7741f9 a25082d -- CLAUDE.md`. |
| Context management strategy | *Working sessions* section of CLAUDE.md; `/clear`, `/compact` and `claude --continue` in [`entry-form-log-session-annotated.md`](entry-form-log-session-annotated.md) (sections 0, 4, 7) and [`screenshots/continue-resume.png`](screenshots/continue-resume.png); discussed in [`reflection.md`](reflection.md) §2 |

## Part 2: Explore → Plan → Implement → Commit (30%)

Feature: issue #3, entry form and project log (PR #10, merged). Annotated log:
[`entry-form-log-session-annotated.md`](entry-form-log-session-annotated.md).
Raw logs: [`entry-form-log-session-part1.txt`](entry-form-log-session-part1.txt)
(rebuilt from the transcript, see
[`transcript-recovery-session.txt`](transcript-recovery-session.txt)) and
[`entry-form-log-session-part2.txt`](entry-form-log-session-part2.txt).

| Phase | Evidence |
| --- | --- |
| Explore | Part 1 log, 21:10–21:13: reads the issue, Supabase helpers, migration and the bundled Next.js docs; findings recorded in the plan's *Context* section |
| Plan | Plan mode entered 21:10:57, `AskUserQuestion` on data access and route, `ExitPlanMode` approved 21:19:37; plan saved as [`entry-form-log-plan.md`](entry-form-log-plan.md) |
| Implement | `73d7f81`, `c0da093`, `9d2d562`, `4011dc2`, `47ea9d4`, then after `/compact`: `1ae81a2`, `3ea0695`, `f285ce6`, `9746ffa` |
| Commit | Plan committed first (`494b452`); 10 commits on `feature/3-entry-form-log`, all with Conventional Commit prefixes; merged through reviewed PR #10 |

Ziye's issue #4 session also started with Plan mode before any code
([`visibility-tdd-session-annotated.md`](visibility-tdd-session-annotated.md), section 3).

## Part 3: TDD with Claude Code (30%)

Feature: issue #4, visibility rules in [`src/lib/visibility.ts`](../../src/lib/visibility.ts)
(PR #9, merged). Annotated log:
[`visibility-tdd-session-annotated.md`](visibility-tdd-session-annotated.md),
which quotes the failing output for each red step.

| PRD rule (Visibility) | Red | Green | Refactor |
| --- | --- | --- | --- |
| Only a contributor or the overseer can read a project | `864227c` | `dd8fa8f` | skipped, nothing to clean up |
| A contributor edits or deletes only their own entries | `fb44bd8` | `a09d527` | skipped |
| An overseer reads every entry but cannot edit | `3552aa3` | `9c92bbe` | `b437c2f` (shared membership role lookup) |
| A non-member gets no data, not even the project name | `2c44267` | `a6c8d26` | `aa5a2b4` (keep the caller's row type; made after the PR's first review) |
| Coverage gaps found in review | `18f9054`, `7b64a26` (pass on first run; the commit messages say so) | — | — |

More red/green pairs from the issue #3 session: `c0da093` → `9d2d562`
(entry types, required fields), `4011dc2` → `47ea9d4` (newest-first order),
`1ae81a2` → `3ea0695` (create-entry action and form).

Refactor commits were made only when there was real cleanup to do. We decided
not to add empty `refactor:` commits.

## Part 4: Reflection and session log (15%)

| Requirement | Evidence |
| --- | --- |
| Workflow compared with our previous approach | [`reflection.md`](reflection.md) §1 |
| Context management strategies that worked best | [`reflection.md`](reflection.md) §2 |
| Annotated session log | [`entry-form-log-session-annotated.md`](entry-form-log-session-annotated.md) (Part 2), [`visibility-tdd-session-annotated.md`](visibility-tdd-session-annotated.md) (Part 3) |

## Other logs in this folder

- [`board-setup-session.txt`](board-setup-session.txt): GitHub labels,
  milestones, issues #1–#5 and the project board created with Claude Code.

## Rubric self-check

| Rubric item | Status | Notes |
| --- | --- | --- |
| CLAUDE.md has tech stack, architecture, conventions, testing strategy, do's/don'ts | ✅ | |
| At least one `@import` | ✅ | Two |
| Permissions configured | ✅ | allow / ask / deny |
| `/init` output shown, and CLAUDE.md improved from it | ✅ | `a7741f9` → `a25082d` |
| `/clear`, `/compact`, `--continue` shown | ✅ | All three in the issue #3 session |
| Explore with Glob/Grep/Read | ✅ | Read and search calls in the part 1 log |
| Plan mode used to design the approach | ✅ | Plan mode markers plus the committed plan |
| At least 3 commits showing the workflow | ✅ | 10 commits for issue #3 |
| Tests committed before implementation | ✅ | Every `feat:` in `src/lib/` follows its `test:` |
| Red, green, refactor visible in history | ✅ | See the Part 3 table |
| All acceptance criteria covered | ✅ | Four visibility rules, each with tests |
| 1–2 page reflection answering both questions | ✅ draft | Waiting for both partners' edits |
| Annotated session log | ✅ | Two annotated logs |
| Submitted on Canvas | ⬜ | Due Nov 22, 11:59pm PT |
