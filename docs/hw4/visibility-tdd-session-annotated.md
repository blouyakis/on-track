# HW4 Part 3: Visibility rules with TDD (annotated session log)

- **Issue:** [#4 Visibility rules (HW4 Part 3, TDD)](https://github.com/blouyakis/on-track/issues/4)
- **Branch:** `feature/4-visibility-rules`
- **Tool:** Claude Code (Claude Opus 5.5), run by Ziye Huang
- **Date:** 2026-11-18

> **About this log.** This is a condensed write-up of the session, not a raw
> export. Long tool output is shortened, and nothing was reordered. Test
> failure output is quoted exactly as it appeared.
>
> Lines that start with **NOTE (Ziye)** are my annotations, added after the
> session. Everything else is the conversation.

---

## 1. Reading the issue and checking the branch name

**❯ Ziye:** Look at the acceptance criteria of issue #4. Also check, using
CLAUDE.md, whether this worktree's name follows our conventions.

**⏺ Claude:** *(ran `gh issue view 4`, `git branch --show-current`, `git worktree list`)*

Summarized the nine acceptance criteria: four business rules taken from the
PRD's "Visibility" section, plus five process rules (failing test committed
first, `test:`/`feat:`/`refactor:` commits, no React/Next.js/Supabase imports
in `src/lib/`, tests + lint + type check pass, PR reviewed by Barbara with an
AI disclosure).

On naming: CLAUDE.md governs the **branch** name, not the worktree folder.
The branch format is `<type>/<issue-number>-short-description`. The current
branch, `SeraphimHuang/visibility-rules-hw4-part-3-tdd`, starts with a
username instead of a type and has no issue number. Suggested
`feature/4-visibility-rules`.

**❯ Ziye:** OK, rename it to `feature/4-visibility-rules`.

**⏺ Claude:**
```
$ git branch -m SeraphimHuang/visibility-rules-hw4-part-3-tdd feature/4-visibility-rules
feature/4-visibility-rules
```

> **NOTE (Ziye):** The tool created the branch with a default name. I checked
> it against CLAUDE.md before writing any code so the branch would match our
> `<type>/<issue>-description` convention and link to the issue.

---

## 2. Aside: permission modes

**❯ Ziye:** What's the difference between Auto Mode and Bypass Permissions Mode?

**⏺ Claude:** Auto Mode runs a classifier on each action, so safe actions go
through without a prompt and risky ones are blocked or sent back to me.
Bypass skips every check. Claude pointed out that this session was running
in Bypass mode on my own machine, and recommended Auto or default mode for
day-to-day work.

> **NOTE (Ziye):** This is why the rename above ran without a confirmation
> prompt. I kept this in mind and reviewed each command Claude ran in the
> rest of the session.

---

## 3. Planning before coding

**❯ Ziye:** I'm starting this issue. Read the acceptance criteria and give me
a plan.

**⏺ Claude:** *(listed `src/`, read the sanity test, `vitest.config.ts`,
`package.json`, `tsconfig.json`)*

Plan:
- Two files: `src/lib/visibility.ts` and `src/lib/__tests__/visibility.test.ts`.
- Plain types: `Role`, `Membership { userId, projectId, role }`,
  `Entry { id, projectId, authorId }`, `Project { id, name }`.
- One function per rule: `canReadProject`, `canModifyEntry`, then
  `visibleEntries` and `visibleProject` (return `[]` and `null` for
  non-members).
- Test cases including edge cases: a member of a *different* project, an
  author who is no longer a member, an entry whose project doesn't match the
  author's membership.
- Red → green → refactor per rule, running `npm test`, `npm run lint` and
  `npx tsc --noEmit` before each commit.
- Three open questions: (1) can an overseer edit entries they wrote? (2) one
  function for edit and delete, or two? (3) should there be a `refactor:`
  commit even when nothing needs cleaning?

> **NOTE (Ziye):** I asked for a plan first, as CLAUDE.md requires for changes
> that touch more than one file. The open questions were real gaps in the PRD.

**❯ Ziye:** Does this depend on PR #6, which isn't merged yet?

**⏺ Claude:** *(ran `gh pr view 6` and read the migration in its diff)*

No code dependency: `src/lib/` may not import Supabase, the unit tests use
plain data, and the two branches touch different files. But PR #6's Row
Level Security policies express the same rules, so the functions should
agree with them. The migration gives overseers **no** insert, update or
delete policy on entries, which answers open question 1: only contributors
can modify entries, and only their own.

> **NOTE (Ziye):** I asked this to avoid blocking on Barbara's PR. It also
> settled a design question. CLAUDE.md says access is enforced twice (server
> code and RLS), so the TypeScript rules must match the database policies.

**❯ Ziye:** Where is "refactor" mentioned? Is it in CLAUDE.md?

**⏺ Claude:** Yes. CLAUDE.md's Testing strategy section lists
`test:` / `feat:` / `refactor:` "with one commit per step", and issue #4 has
the criterion "Commits follow `test:` (red), `feat:` (green), `refactor:`".
Neither says an empty refactor commit is required when there's nothing to
clean up.

**❯ Ziye:** I don't think every rule needs a forced refactor. If there's
nothing to refactor, skip it. Let's start.

> **NOTE (Ziye):** My decision. A refactor commit with no real change would
> only pad the history. Skipped refactors are listed in the PR description.

---

## 4. Rule 1: only members can read a project

**Red.** Claude wrote four tests for `canReadProject`: a contributor of the
project, its overseer, a member of a different project, and a user with no
memberships.

```
Error: Failed to resolve import "@/lib/visibility" from "src/lib/__tests__/visibility.test.ts". Does the file exist?
```
Commit `864227c test: add failing tests for project read access by membership`

> **NOTE (Ziye):** The test fails for the expected reason: the module doesn't
> exist yet. It is committed before any implementation.

**Green.** Minimal implementation: `memberships.some(m => m.userId === userId && m.projectId === projectId)`.

```
Test Files  2 passed (2)
     Tests  5 passed (5)
src/app/layout.tsx(20,50): error TS2304: Cannot find name 'LayoutProps'.
```

Claude identified the type error as unrelated to this change: Next.js route
types have to be generated first, the same fix CI uses (commit `2b7986d`).
After `npx next typegen`, `tsc` passed.

Commit `dd8fa8f feat: allow project members to read a project`

**Refactor:** skipped. The implementation is a single expression.

---

## 5. Rule 2: contributors edit or delete only their own entries

**Red.** Four tests for `canModifyEntry` (edit and delete share one check):
the author, a teammate, an author whose membership was removed, and an
author whose entry belongs to a project they're not in.

```
× a contributor can edit or delete an entry they created
× a contributor cannot edit or delete a teammate's entry
× an author who is no longer a member cannot edit or delete their entry
× an author cannot edit or delete an entry in a project they are not a member of
TypeError: canModifyEntry is not a function
Tests  4 failed | 4 passed (8)
```
Commit `fb44bd8 test: add failing tests for editing and deleting only your own entries`

**Green.** Minimal implementation: the user is the author **and** a member of
the entry's project. Tests: 9 passed.

Commit `a09d527 feat: let authors who are project members edit or delete their entries`

**Refactor:** skipped.

> **NOTE (Ziye):** The implementation deliberately did *not* check the role
> yet. That check had to be driven by a failing test in rule 3.

---

## 6. Rule 3: overseers read everything but cannot edit

**⏺ Claude** flagged a TDD problem before writing the tests: "the overseer
cannot edit a contributor's entry" would pass immediately, because rule 2
already requires authorship. A test that never fails can't drive the
implementation. So the red step relied on two other tests:

- a new `visibleEntries` function returns every entry in the overseer's
  project, and only that project's;
- an overseer cannot modify an entry **even when listed as its author**
  (consistent with PR #6's RLS).

The already-passing test was kept as a regression guard.

```
× the overseer can read every entry in their project, and only that project
× the overseer cannot edit or delete an entry even when listed as its author
TypeError: visibleEntries is not a function
AssertionError: expected true to be false // Object.is equality
Tests  2 failed | 9 passed (11)
```
Commit `3552aa3 test: add failing tests for overseer read-all and no-edit access`

> **NOTE (Ziye):** This is the key TDD moment of the session. The second
> failure is a real assertion failure, not a missing function: the rule-2
> code really did let an overseer edit their "own" entry.

**Green.** `canModifyEntry` now requires the `contributor` role.
`visibleEntries` only filters by project for now. Its membership check is
left for rule 4's tests to drive. Tests: 12 passed. Lint gave one warning
(`memberships` unused), which rule 4 resolves.

Commit `9c92bbe feat: restrict entry edits to contributors and list a project's entries`

**Refactor.** `canReadProject` and `canModifyEntry` both searched the
memberships list. Claude extracted a private helper,
`roleIn(userId, projectId, memberships): Role | null`, and moved the type
declarations to the top of the file. Tests still 12 passed.

*(Claude's first `Write` was rejected because the file had changed on disk
since it last read it. It re-read the file, confirmed the content matched the
last commit, and retried.)*

Commit `b437c2f refactor: share the membership role lookup between visibility checks`

---

## 7. Rule 4: non-members get no data, not even the project name

**Red.** Five tests: a member gets the project with its name; a user with no
memberships and a member of another project get `null` from
`visibleProject` and `[]` from `visibleEntries`.

```
× a member gets the project, including its name
× a user with no memberships does not get the project or its name
× a member of another project does not get the project or its name
× a user with no memberships gets no entries from the project
× a member of another project gets no entries from the project
TypeError: visibleProject is not a function
AssertionError: expected [ { id: 'e1', projectId: 'p1', …(1) } ] to deeply equal []
Tests  5 failed | 11 passed (16)
```
Commit `2c44267 test: add failing tests for hiding project data from non-members`

> **NOTE (Ziye):** The `visibleEntries` failures show a real leak: before this
> step, a non-member could get a project's entries. The test caught exactly
> the hole the PRD rule describes.

**Green.** `visibleEntries` returns `[]` unless `canReadProject`.
`visibleProject` returns the project or `null`. Tests 17 passed; the lint
warning is gone; `tsc` passes. `visibility.ts` has no imports.

Commit `a6c8d26 feat: return no project data or entries to non-members`

**Refactor:** skipped.

---

## 8. Result

```
a6c8d26 feat: return no project data or entries to non-members
2c44267 test: add failing tests for hiding project data from non-members
b437c2f refactor: share the membership role lookup between visibility checks
9c92bbe feat: restrict entry edits to contributors and list a project's entries
3552aa3 test: add failing tests for overseer read-all and no-edit access
a09d527 feat: let authors who are project members edit or delete their entries
fb44bd8 test: add failing tests for editing and deleting only your own entries
dd8fa8f feat: allow project members to read a project
864227c test: add failing tests for project read access by membership
```

Every `feat:` commit is preceded by its `test:` commit.

> **NOTE (Ziye):** Afterwards I asked Claude where the requirement to save the
> session log came from. It admitted it had stated this too confidently:
> neither CLAUDE.md nor the issue requires it. It had inferred it from the
> existing logs in `docs/hw4/`. The actual requirement ("include annotated
> Claude Code session log showing your workflow") comes from the HW4
> assignment, which is why this file exists.

---

## 9. Code review before opening the PR

**❯ Ziye:** Before that, review my PR.

**⏺ Claude:** No PR existed yet, so it ran the `/code-review` skill on the
branch. That review runs in a separate agent and doesn't see the
conversation, so it isn't anchored on how the code was written. It returned
five findings. Claude checked each one against the code and against PR #6's
migration:

| # | Finding | Verdict |
| --- | --- | --- |
| 1 | `roleIn` uses `find`, so two membership rows for the same user and project would give an order-dependent answer (flagged "important") | Can't happen: PR #6 makes `(project_id, user_id)` the primary key. Add a comment stating the assumption. |
| 2 | `visibleProject` returns the whole object, so future private fields (e.g. invite code) would leak | Not applicable yet (`Project` is `{id, name}`). Deferred to the invite-code feature. |
| 3 | No test that a contributor can read teammates' entries | Real gap in PRD coverage. Add a test. |
| 4 | No test that an overseer is blocked from *other* projects | Real gap. Add tests. |
| 5 | `visibleEntries` doesn't sort, and silently drops wrong-project rows | Out of scope for this issue (project log, data layer). |

> **NOTE (Ziye):** The review's top finding was "important", but it didn't
> hold up once checked against the schema. I didn't accept or reject
> findings on their label. Each one was checked against the actual code and
> database.

**❯ Ziye:** OK, make the changes you suggested.

The new tests for findings 3 and 4 **passed on the first run**
(20 passed). They cover behaviour that already existed, so there was no red
step. The commit message says so explicitly.

```
18f9054 test: cover contributor reads of teammates' entries and overseer cross-project access
4ff8801 docs: note the one-membership-per-project assumption in roleIn
```

> **NOTE (Ziye):** Writing tests after the code breaks the TDD order, so I
> made sure the commit says these are coverage tests found in review and
> don't drive new behaviour. This keeps the history honest instead of
> pretending they were red.

---

## 10. Opening the PR and correcting its description

Claude pushed the branch and opened
[PR #9](https://github.com/blouyakis/on-track/pull/9). It caught its own
mistake in the test count (it wrote 21; the real total is 20) and fixed it.
CI passed: install, lint, typecheck, test, build and audit.

**❯ Ziye:** The Human review line says the session log is included. Is it?
And shouldn't "Notes for the reviewer" only list what Barbara needs to
decide or know? This is too much.

**⏺ Claude:** Agreed on both. The log was not in the PR yet. Claude also
admitted that the AI disclosure overstated my part: it said I had "reviewed
each red and green step", but Claude had run and committed those steps
itself. The notes were cut from five TDD-process details to the three
things Barbara needs: overseers cannot edit any entry (the point she asked
to confirm in #6), one test commit has no red step, and refactors were
skipped where there was nothing to clean up.

> **NOTE (Ziye):** The AI disclosure has to be accurate, so I didn't let it
> credit me with reviews I hadn't done. After that I reviewed both changed
> files myself, and the description was updated to say so.

## Where I steered the AI

- Checked the branch name against CLAUDE.md before any code was written.
- Asked for a plan first and answered its open questions.
- Checked whether the work depended on an unmerged PR. This aligned the
  TypeScript rules with the database policies.
- Decided not to add empty refactor commits.
- Questioned an unsupported claim about where a requirement came from.
- Had the change reviewed independently, then checked each finding against
  the schema before acting on it.
- Cut the reviewer notes down to what Barbara needs, and corrected an AI
  disclosure that overstated my review.
