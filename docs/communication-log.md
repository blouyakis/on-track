# OnTrack Communication Log

CS6983 AI Coding, Fall 2026, Project 3 (with HW4 and HW5)
Team: Barbara (Bobbi) Louyakis, Ziye Huang

Every meeting, standup and async update between us, in date order. It is the same record we kept as a spreadsheet for Project 2, moved into the repo so it sits next to the work it describes.

## How to add an entry

1. Copy the template below to the end of the file and give it the next number.
2. Fill in every field. Write "None" when a field does not apply, so it is clear it was not skipped.
3. Commit it on the branch you are working on, or on a `docs/` branch if it stands alone. The log does not need its own issue.

Each standup goes in two places: an entry in this log, and its own file in `docs/sprints/sprint-N/standups/`, named `YYYY-MM-DD-name.md` (for example `docs/sprints/sprint-1/standups/2026-11-25-ziye.md`). One file per person per standup keeps us from getting merge conflicts. Once OnTrack is deployed, standups are also logged in OnTrack itself as `standup` entries, and an export is saved in `docs/sprints/` at the end of each sprint.

### Fields

| Field | What goes in it |
| --- | --- |
| Date | `YYYY-MM-DD` |
| Time (ET) | Start time, or a range for a thread, in Eastern Time. Add PT when it helps. |
| Type | One of OnTrack's meeting-style entry types: Meeting, Check-in, Standup, Async update, Planning, Sprint planning, Review, Retrospective. Use Other for anything else. |
| Format | Sync (video), Sync (in person), Async (Slack), or Async (GitHub) |
| Topics discussed | What it was about |
| Decisions made | What we agreed, or "None; informational" |
| Action items (owner) | Who does what next, or "None" |
| Notes | Anything else: what was completed and any blockers |

For a standup, put what was completed in Notes, what is next in Action items, and any blocker in Notes.

Project information only. Leave out anything personal, such as schedules, availability, or what either of us is doing outside the project. Do not paste secrets, keys or passwords into this log.

### Template

```markdown
### N · YYYY-MM-DD · Type

- **Time (ET):**
- **Format:**
- **Topics discussed:**
- **Decisions made:**
- **Action items (owner):**
- **Notes:**
```

## Log

### 1 · 2026-11-17 · Planning

- **Time (ET):** 15:16–19:39
- **Format:** Async (Slack)
- **Topics discussed:** Ideas for Project 3; keeping the scope on the simpler side; Ziye's office hours queue idea; Barbara's idea for a team contribution log with Contributor and Overseer roles; Barbara's draft proposal (name, problem description, target users, six user stories).
- **Decisions made:** Project 3 is OnTrack, a shared contribution log. The proposal is approved as drafted and ready to post in #projects. We will use OnTrack for our own Project 3 log once it is built.
- **Action items (owner):** Barbara: post the proposal in #projects for the professor's approval. Both: break the work into issues and set up the board once it is approved.
- **Notes:** HW4 is due Nov 23 and needs the Project 3 repo, so the idea had to be picked within a day.

### 2 · 2026-11-18 · Planning

- **Time (ET):** 14:02–16:19
- **Format:** Async (Slack)
- **Topics discussed:** Posting the proposal; the work plan with task lists and suggested splits for HW4, HW5 and Project 3; how to keep the commit history and PR reviews balanced, since Project 3 grades can be adjusted by up to 10% for unbalanced contribution; the order of the HW4 setup work.
- **Decisions made:** HW4 uses option B: Barbara does the setup and Part 2, Ziye does Part 3 (TDD) and reviews Barbara's Part 2 PR, and Ziye drafts the reflection for both to edit. HW5: we do the skill together and decide who sets up the MCP server when we get there. Project 3: coding and PR reviews stay roughly even, and the docs, blog and video are split as we go.
- **Action items (owner):** Barbara: post the proposal; create the repo, push the scaffold with Vitest first and add Ziye; then finish CLAUDE.md and the permissions. Ziye: start HW4 Part 3 once added to the repo.
- **Notes:** Completed: work plan shared with Ziye. The visibility rules are pure logic, so Part 3 does not wait on Part 2.

### 3 · 2026-11-18 · Async update

- **Time (ET):** 18:22–20:02
- **Format:** Async (Slack)
- **Topics discussed:** The new repo and how to run it; the finished HW4 setup (CLAUDE.md, `docs/PRD.md`, `.claude/settings.json`, `docs/hw4/`); the conventions that affect Part 3 (branch names, `test:`/`feat:`/`refactor:` commits, pure functions in `src/lib/`); the eleven entry types; Ziye's repo invitation still showing as pending; the project board and issue #4.
- **Decisions made:** The eleven entry types stay as they are. Ziye uses the existing issue #4 for the visibility rules, on the branch `feature/4-visibility-rules`, and can edit its acceptance criteria.
- **Action items (owner):** Ziye: accept the repo invitation; pull, then start Part 3 with the acceptance criteria and the failing tests. Barbara: assign Ziye to #4 and #5 and add her to the board once the invitation is accepted; start Part 2.
- **Notes:** Completed: repo created (https://github.com/blouyakis/on-track) with a Next.js and TypeScript scaffold and Vitest; CLAUDE.md, the PRD and the shared permission rules pushed; board created with the five HW4 issues. The project is on Node 26 (`.nvmrc`), because Vitest 5 did not work with the older Node types. Blocker: Ziye cannot push or be assigned until the invitation is accepted.

### 4 · 2026-11-18 · Async update

- **Time (ET):** 21:01–22:18
- **Format:** Async (Slack)
- **Topics discussed:** Supabase setup (issue #2, PR #6); the CI workflow (issue #7, PR #8) and why it has to merge first; branch protection on `main`; labels and milestones; what Ziye needs to do and in what order; Ziye's review of the database migration.
- **Decisions made:** PR #8 merges before PR #6, because `main` now requires the CI checks and PR #8 adds them. Same workflow as Project 2: one branch per issue, and every PR description has the AI disclosure. Barbara merges #6 herself once its checks have run.
- **Action items (owner):** Ziye: review PR #8, then PR #6; read CLAUDE.md and work on #4; draft the reflection (#5) after Parts 2 and 3 are done. Barbara: update PR #6 after #8 merges so its checks run, then merge it.
- **Notes:** Completed: Ziye accepted the repo invitation (21:57); PR #8 approved and merged by Ziye (https://github.com/blouyakis/on-track/pull/8); PR #6 approved by Ziye after she ran the migration locally and checked Row Level Security as each role against the PRD (https://github.com/blouyakis/on-track/pull/6). `main` is protected: PRs only, one approval, no force pushes, six required checks. Milestones: HW4, HW5, Sprint 1, Sprint 2.

### 5 · 2026-11-18 · Review

- **Time (ET):** 22:58 (Nov 18) – 01:27 (Nov 19)
- **Format:** Async (Slack)
- **Topics discussed:** PR #9 for the visibility rules (issue #4, HW4 Part 3); whether Ziye's annotated session log belongs in that PR; PR #10 for the entry form and project log (issue #3, HW4 Part 2); a known problem in PR #10 when the form is submitted before JavaScript loads and the server rejects it; board access.
- **Decisions made:** Annotated session logs stay in the feature PRs and live in `docs/hw4/`, so all the HW4 evidence is in one place. The no-JavaScript problem gets its own follow-up issue and does not block PR #10.
- **Action items (owner):** Barbara: open the follow-up issue (done, #11); merge PR #10. Ziye: draft the HW4 reflection once #10 is merged.
- **Notes:** Completed: PR #6 merged by Barbara; PR #9 approved by Barbara with two non-blocking comments, then addressed and merged by Ziye (https://github.com/blouyakis/on-track/pull/9); PR #10 opened by Barbara with 12 commits and all six checks passing, then approved by Ziye with a few non-blocking comments (https://github.com/blouyakis/on-track/pull/10); Ziye given write access to the board and assigned to #4 and #5. The close and reopen on PR #6 was only to make the required checks run.

### 6 · 2026-11-19 · Async update

- **Time (ET):** 14:55–15:10
- **Format:** Async (Slack)
- **Topics discussed:** PR #10 merged; Ziye's plan for the HW4 reflection.
- **Decisions made:** None; informational.
- **Action items (owner):** Ziye: draft the reflection. Barbara: review and edit it.
- **Notes:** Completed: PR #10 merged by Barbara. HW4 is due Sunday, Nov 22.

### 7 · 2026-11-19 · Review

- **Time (ET):** 22:12
- **Format:** Async (Slack)
- **Topics discussed:** PR #12 with the HW4 write-up (issue #5): the reflection, the annotated version of Barbara's issue #3 session log, and an index of all the HW4 evidence.
- **Decisions made:** None; informational. Barbara can edit directly on the branch `docs/5-hw4-reflection`.
- **Action items (owner):** Barbara: check that the notes on her session log are accurate; review the reflection and add her own experience.
- **Notes:** Completed: PR #12 opened by Ziye (https://github.com/blouyakis/on-track/pull/12) with `docs/hw4/reflection.md`, `docs/hw4/entry-form-log-session-annotated.md` and `docs/hw4/README.md`. Barbara's raw session logs are unchanged.

### 8 · 2026-11-20 · Review

- **Time (ET):** 23:58 (Nov 20) – 00:02 (Nov 21)
- **Format:** Async (Slack)
- **Topics discussed:** Barbara's review of PR #12, still in progress; Ziye's fixes for the seven inline comments.
- **Decisions made:** None; informational.
- **Action items (owner):** Barbara: finish the review and her updates, starting from Ziye's replies.
- **Notes:** Completed: Barbara left seven inline comments on PR #12; Ziye fixed and pushed all seven and replied under each with what changed. PR #12 was approved and merged by Barbara on Nov 21.

### 9 · 2026-11-21 · Async update

- **Time (ET):** 15:42
- **Format:** Async (Slack)
- **Topics discussed:** Barbara's diagnosis of issue #11 (a rejected entry submitted before JavaScript loads shows a Next.js error); the README note in PR #13; the follow-up test in issue #14; the plan to set up the project board for HW5 and Project 3.
- **Decisions made:** None; informational. Issue #11 is documented as a known issue with no code workaround, because the cause is a Next.js 16.4.6 bug that only happens under `next dev`.
- **Action items (owner):** Ziye: review PR #13. Barbara: set up the project board (HW5 issues in Sprint ToDo, Project 3 issues in Backlog, with labels, milestones and assignees) and message Ziye when it is ready to review.
- **Notes:** Completed: diagnosis posted on #11 (https://github.com/blouyakis/on-track/issues/11#issuecomment-7068768693); #11 closed and moved to Done; PR #13 opened, docs only, all six checks passing (https://github.com/blouyakis/on-track/pull/13); #14 opened in the Backlog for the Playwright test with JavaScript off. PR #13 was approved by Ziye and merged later that afternoon. None of this affects HW4, which is fully merged.

### 10 · 2026-11-21 · Planning

- **Time (ET):** 16:20
- **Format:** Async (Slack)
- **Topics discussed:** The project board is ready for Ziye's review, with the HW5, Sprint 1 and Sprint 2 issues and who owns each; the three bonus tasks (#46, #47, #48); what the Agent SDK feature would be; new dependencies; the second skill; where the process docs and async standups live; the API key for the AI review stage.
- **Decisions made:** HW5 is done as a pair; the split only says who leads each part. Barbara takes the Vercel deploy (#28). Async standups and this log are kept in the repo instead of Google. Still open, waiting on Ziye: which bonus tasks to commit to; what the Agent SDK feature is (Barbara suggested a project digest and offered to build it); the new dependencies and the PDF library; which second skill to build.
- **Action items (owner):** Ziye: review the board, her assignments and her issues' acceptance criteria; answer the open questions; say when she is ready for the API key (#27). Barbara: open a PR for the communication log; add the bonus tasks we keep to the work plan and close the ones we drop; add the API key as a GitHub secret when Ziye is ready.
- **Notes:** Completed: 34 issues added to the board (https://github.com/users/blouyakis/projects/4): HW5 #15–#18 in Sprint ToDo, and Sprint 1 (#19–#29, plus #14) and Sprint 2 (#30–#48) in Backlog, each with labels, a milestone and assignees. Sprint 1 runs Nov 23 to Dec 6 and Sprint 2 runs Dec 7 to Dec 15.

### 11 · 2026-11-21 · Planning

- **Time (ET):** 16:40–16:42
- **Format:** Async (Slack)
- **Topics discussed:** Ziye's review of the board and her answers to the open questions from entry 10: assignments, the bonus tasks, new dependencies, the second skill, where standups live, and the API key for #27; submitting HW4.
- **Decisions made:** The assignments stand, and Ziye takes #14 after #25. The new dependencies are approved. Both of us submit HW4 on Canvas separately, in case group submissions do not sync. Ziye proposed the following and Barbara agreed after the thread. Bonus: we commit to #46 (fast-check) and #47 (Stryker), with #46 after #31 and #32, and #48 is the first to cut if time gets short. #48 is the project digest, built by whoever has room. The coverage provider is `@vitest/coverage-v8`. The PDF library is pdfmake, because the document is a plain object that a pure function in `src/lib/` can build and unit-test without rendering. The second skill is `/create-pr`, which enforces the branch name, the pre-commit checks and the AI disclosure. Standups stay in the repo, in two places: an entry in this log, and one file per person per standup in `docs/sprints/sprint-N/standups/` (for example `docs/sprints/sprint-1/standups/2026-11-25-ziye.md`), which avoids merge conflicts.
- **Action items (owner):** Both: submit HW4 on Canvas. Barbara: update the issues and the work plan with these decisions; save the Nov 21 session log as HW5 evidence. Ziye: start Sprint 1 on Nov 23; ask Barbara for the API key when she reaches #27.
- **Notes:** Completed: Ziye approved and merged PR #13 and reviewed the board. HW4 is complete on GitHub. Ziye offered to take #46, and #48 if she has time.

### 12 · 2026-11-21 · Async update

- **Time (ET):** 16:44
- **Format:** Async (Slack)
- **Topics discussed:** The communication log in PR #49 and its ten entries; Barbara's question about having AI update the log automatically, with a `/log` skill as one option; which skill counts as the second skill for #37; submitting HW4.
- **Decisions made:** The log stays in the repo. Both of us submit HW4 on Canvas (confirmed). Ziye proposed building both `/create-pr` and `/log`, since they solve different problems, and Barbara agreed after the thread: either one can count as the second skill and the other is a tool for us. Ziye builds `/log` (#50) and Barbara keeps `/create-pr` (#37).
- **Action items (owner):** Ziye: review PR #49 and check her side of each entry. Ziye: open an issue for `/log` (done, #50). Both: submit HW4 on Canvas.
- **Notes:** Completed: PR #49 opened by Barbara with the log and entries 1 to 10 (https://github.com/blouyakis/on-track/pull/49); entry 11 added to the same PR; the bonus tasks added to the work plan.
