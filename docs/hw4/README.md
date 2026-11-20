# HW4: Claude Code Workflow & TDD

OnTrack (CS6983 Project 3) · Barbara (Bobbi) Louyakis, Ziye Huang

Evidence for HW4, produced while building OnTrack.

## Part 1: Claude Code project setup

- [`/CLAUDE.md`](../../CLAUDE.md): project context, tech stack, architecture
  decisions, conventions, testing strategy, do's and don'ts, and working
  sessions. Imports `@AGENTS.md` and `@docs/PRD.md`.
- [`/.claude/settings.json`](../../.claude/settings.json): permission rules
  (allow, ask, deny).
- [`init-session.txt`](init-session.txt): the `/init` run. Its output was
  committed as is (`a7741f9`) and then rewritten (`a25082d`).
- [`permissions-session.txt`](permissions-session.txt) and
  [`screenshots/permissions-session.png`](screenshots/permissions-session.png):
  the loaded permission rules.
- [`screenshots/continue-resume.png`](screenshots/continue-resume.png):
  resuming a session with `claude --continue`.
- [`board-setup-session.txt`](board-setup-session.txt): GitHub labels,
  milestones, issues and project board set up with Claude Code.

## Part 2: Explore → Plan → Implement → Commit (issue #3, PR #10)

- [`entry-form-log-session-annotated.md`](entry-form-log-session-annotated.md):
  annotated walk through the session, phase by phase, including `/clear`,
  `/compact` and `claude --continue`.
- [`entry-form-log-plan.md`](entry-form-log-plan.md): the plan approved in
  Plan mode, committed before any code (`494b452`).
- [`entry-form-log-session-part1.txt`](entry-form-log-session-part1.txt) and
  [`entry-form-log-session-part2.txt`](entry-form-log-session-part2.txt): the
  raw session log, before and after `/compact`.
- [`transcript-recovery-session.txt`](transcript-recovery-session.txt): how
  part 1 was rebuilt from the local session transcript.

## Part 3: TDD (issue #4, PR #9)

- [`visibility-tdd-session-annotated.md`](visibility-tdd-session-annotated.md):
  annotated red, green, refactor session for the visibility rules in
  [`src/lib/visibility.ts`](../../src/lib/visibility.ts), with the failing
  output of each red step.

## Part 4: Reflection

- [`reflection.md`](reflection.md): how the workflow compares with our
  previous approach, and which context management strategies worked best.
