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

### 13 · 2026-11-21 · Async update

- **Time (ET):** 16:53–23:46 (13:53–20:46 PT)
- **Format:** Async (Slack)
- **Topics discussed:** Barbara's follow-up on the decisions in entries 11 and 12; one last log commit that missed the PR #49 merge and went into PR #52; a release as the HW4 submission link.
- **Decisions made:** Barbara proposed that we both submit the `hw4-submission` release link on Canvas, and Ziye agreed. Barbara's agreement to Ziye's proposals, the two skills and the standup rule are already recorded in entries 11 and 12.
- **Action items (owner):** Ziye: review and merge PR #52 and check entries 11 and 12 (done, #52). Ziye: make `/log` write the per-person standup file (#50). Both: submit https://github.com/blouyakis/on-track/releases/tag/hw4-submission on Canvas (Ziye done).
- **Notes:** Completed: the decisions recorded on #46, #47, #48, #26, #34 and #37; Barbara's duplicate `/log` issue closed; #19 and #30 updated with the standup rule, and a comment left on #50 about the per-person file; the `hw4-submission` release made as a fixed snapshot of the repo with links to all four deliverables, so Sprint 1 changes do not affect grading. PR #52 (https://github.com/blouyakis/on-track/pull/52) holds the last log commit, made after Ziye merged PR #49 at 16:47; Ziye approved and merged it at 23:42 and confirmed entries 11 and 12 describe her side accurately. Barbara held off on new log entries until #52 was merged.

### 14 · 2026-11-22 · Review

- **Time (ET):** 01:10 (Nov 22) – 00:45 (Nov 24)
- **Format:** Async (Slack)
- **Topics discussed:** Ziye's PR #53 (Prettier and the coverage report in CI, issue #26) and PR #54 (the `/log` skill, issue #50); how many entries one pasted thread becomes; how `/log` decides that a post is a standup; Barbara's review of both PRs; the new npm scripts missing from the Claude Code allow list.
- **Decisions made:** Ziye proposed that `/log` groups by exchange, not by message (one conversation about one topic is one entry), and Barbara agreed. Ziye proposed that a post labeled as a standup is treated as one, and that `/log` asks first about an unlabeled post that looks like one; Barbara agreed.
- **Action items (owner):** Barbara: run `/log` on this thread and tell Ziye about anything it should handle better, as input for a v2. Ziye: allow `npm run typecheck`, `npm run format:check` and `npm run test:coverage` in `.claude/settings.json` (#55). Ziye: pull `main` before starting anything new (done).
- **Notes:** Completed: PR #53 opened by Ziye (https://github.com/blouyakis/on-track/pull/53), adding Prettier, `format:check` in the CI lint job, and `test:coverage` with the report uploaded by CI; there is no threshold yet, since #39 adds the 70% gate, and the whole repo was reformatted once in its own commit with no behavior changes. PR #54 opened by Ziye (https://github.com/blouyakis/on-track/pull/54) with the `/log` skill. Ziye tested the standup flow on the Nov 21 thread (2 Standup entries, 1 Review entry and two files in `docs/sprints/sprint-1/standups/`), then reverted all of it, since Sprint 1 had not started and Barbara's message was not meant as a standup; the session log is `docs/skills/log/third-run-session.txt`. Barbara approved and merged both PRs on Nov 23 (19:02 and 19:03), which closed #26 and #50, and confirmed that entry 13 describes Barbara's side accurately. Ziye opened #55 for the allow list, leaving `npm run format` out because the #24 hook will format files on edit.

### 15 · 2026-11-24 · Standup

- **Time (ET):** 03:30
- **Format:** Async (Slack)
- **Topics discussed:** Ziye's standup: three PRs opened, for the hooks (#24), the allow list (#55) and the AI review in CI (#27); three questions for Barbara, on the API key for PR #56, the definition of C.L.E.A.R., and the guard hook in PR #57.
- **Decisions made:** None; informational. Barbara's answers are in entry 16.
- **Action items (owner):** Ziye: mark PR #56 ready for review once the API key is in, so its first AI review can run. Barbara: review PR #57 and PR #58, look through PR #56, and answer the three questions (done; see entry 16).
- **Notes:** Completed: PR #57 opened for #24 (https://github.com/blouyakis/on-track/pull/57), with Claude Code hooks that format on edit and run the tests on Stop, plus a PreToolUse guard that blocks what CLAUDE.md forbids (reading `.env` files, hand-editing `AGENTS.md` or `package-lock.json`, pushing to `main`, force pushes); PR #58 opened for #55 (https://github.com/blouyakis/on-track/pull/58), allowing the new npm scripts in the Claude Code settings; PR #56 opened as a draft for #27, the AI review on pull requests in CI (https://github.com/blouyakis/on-track/pull/56). CI is green on all three. Blocker: PR #56 needs an API key before it can run, and adding the secret needs repo-owner access; the steps are in the PR. Ziye offered to split the cost evenly if Barbara's key is used, or to set up a key. Until the course's definition of C.L.E.A.R. is found, the AI review uses Google's Engineering Practices plus Conventional Comments.

### 16 · 2026-11-24 · Review

- **Time (ET):** 16:45
- **Format:** Async (Slack)
- **Topics discussed:** Barbara's reviews of PR #56, PR #57 and PR #58; how PR #57 should be merged; the guard hook; the API key for the AI review; where C.L.E.A.R. is defined; the Sprint 1 planning note in PR #59.
- **Decisions made:** The guard hook in PR #57 stays as the default: Ziye proposed it and Barbara agreed. The API key: Barbara agreed to Ziye's offer in entry 15 to split the cost evenly; Barbara creates an Anthropic key with a spend limit and adds it as the `ANTHROPIC_API_KEY` secret, so the key is never sent between us.
- **Action items (owner):** Barbara: create the key and add the secret, then tell Ziye. Ziye marking PR #56 ready after that is already recorded in entry 15. Barbara: word around the guard's env-file block in #20 and #28. Ziye: merge PR #57 with a merge commit, not a squash. Ziye: review PR #59 and change anything in the goal or the order of work that does not match Ziye's understanding. Both: whoever finds the C.L.E.A.R. definition first posts it on #27.
- **Notes:** Completed: Barbara approved PR #58 and PR #57, and left a comment review on PR #56 without approving, only because the workflow has not run yet; PR #59 opened by Barbara with the Sprint 1 planning note (https://github.com/blouyakis/on-track/pull/59). Still open, waiting on Ziye: Barbara asked for the merge commit on PR #57 so the test-then-fix commit pairs stay in the history as TDD evidence, and proposed the C.L.E.A.R. item above. Neither of us has found the definition; Barbara expects it in the Week 12 material, and the Project 3 page asks for it by name in PR reviews, so #29 and #38 need it. The guard blocks any command that names an env file, including commit messages and PR bodies. The goal and the order of work in PR #59 are a draft. Risk from the note: #20 removes the demo sign-in that the E2E tests in #25 and #14 use.

### 17 · 2026-11-24 · Standup

- **Time (ET):** 16:45
- **Format:** Async (Slack)
- **Topics discussed:** Barbara's standup: Sprint 1 started on the board, the reviewed PRs and the Sprint 1 planning note; next, the API key and `/add-feature`.
- **Decisions made:** None; informational.
- **Action items (owner):** Barbara: add the API key secret for PR #56; write `/add-feature` v1 (#15), then use it on authentication (#20).
- **Notes:** Completed: Sprint 1 started on the board, with Barbara's Sprint 1 issues in Sprint ToDo and #19 open again after it closed by itself when PR #49 merged; PR #56, PR #57 and PR #58 reviewed, with #57 and #58 approved; PR #59 opened with the Sprint 1 planning note. The merge of PR #53 and PR #54 is already recorded in entry 14. Blockers: none.

### 18 · 2026-11-24 · Standup

- **Time (ET):** 20:46
- **Format:** Async (Slack)
- **Topics discussed:** Ziye's standup: PR #57 and PR #58 merged, PR #59 and PR #60 approved, the first AI review run, where C.L.E.A.R. is defined, and one more commit on PR #56 after Barbara's approval; next, #17, #25 and #14; her plan for the #20 / #25 risk from entry 16.
- **Decisions made:** None; informational. Barbara's reply is in entry 19.
- **Action items (owner):** Ziye: merge PR #56 once its checks pass (done, #56). Ziye: work on #17 (Playwright MCP), then #25 (E2E setup), then #14, the order of her Sprint 1 issues in PR #59.
- **Notes:** Completed: PR #58 and PR #57 merged by Ziye, #57 with a merge commit as asked in entry 16, so the test-then-fix commit pairs are in the history of `main`; PR #59 and PR #60 (https://github.com/blouyakis/on-track/pull/60) approved by Ziye, with a few non-blocking comments on each; the AI review ran successfully for the first time, on PR #56 (https://github.com/blouyakis/on-track/actions/runs/45522440037), after Barbara added the API key, and posted its C.L.E.A.R. summary (https://github.com/blouyakis/on-track/pull/56#issuecomment-7149119122); Ziye found the C.L.E.A.R. definition in the Week 11 deck, not Week 12, and posted it on #27, and the AI review now uses it. Barbara approved PR #56; right after, Ziye pushed one more commit, `400c64e`, which only removes the lines in the code that say the framework comes from the course. PR #56 was merged by Ziye at 20:50, which closed #27. Ziye thanked Barbara for covering the $5 for the API key and offered to split the bill if the cost grows. Ziye proposed building #25 on the demo sign-in for now and adapting it if #20 merges first; see entry 19. No blockers reported.

### 19 · 2026-11-24 · Planning

- **Time (ET):** 22:02
- **Format:** Async (Slack)
- **Topics discussed:** Barbara's reply to Ziye's standup (entry 18): commit `400c64e` on PR #56; Ziye's review notes on PR #60 and PR #59; a CLAUDE.md exception for the red step; the #20 / #25 risk.
- **Decisions made:** Ziye proposed building #25 on the demo sign-in for now and adapting it if #20 merges first, and Barbara agreed: whichever of #20 and #25 merges second adapts.
- **Action items (owner):** Barbara: put both of Ziye's notes on PR #60 into v2 of `/add-feature`, with the reasons, along with the two from the AI review (one `--label` flag per label, and the red step). Barbara: add #20 under "Depends on" for #28 in her next docs PR. Ziye: say whether the CLAUDE.md exception is OK.
- **Notes:** Completed: Barbara read commit `400c64e` and found it good. Still open, waiting on Ziye: the AI review pointed out that CLAUDE.md says to run all four checks before every commit, but a failing-test commit cannot pass `npm test`; Barbara proposed a one-line exception in CLAUDE.md for the red step. Ziye agreed in her review of PR #60 that the `/add-feature` session logs go in `docs/skills/add-feature/`.

### 20 · 2026-11-24 · Standup

- **Time (ET):** 22:02
- **Format:** Async (Slack)
- **Topics discussed:** Barbara's standup: the comment trigger for the AI review tested, PR #60 and PR #59 merged, and what the review runs have cost so far; next, the first `/add-feature` run, on #20.
- **Decisions made:** None; informational.
- **Action items (owner):** Barbara: run `/add-feature` for the first time, on authentication (#20), and save the session logs in `docs/skills/add-feature/`. Barbara: log Ziye's update and this reply with `/log`.
- **Notes:** Completed: the comment trigger tested: Barbara commented `@claude review` on PR #60, and the review ran from `main`, posted a summary and three inline comments, and nothing was blocked with the hooks in place, so both triggers work; PR #60 and PR #59 merged by Barbara, both with merge commits; #15 and #27 closed and in Done. The three review runs so far cost about $0.31 together, so the credit will last a long time. The merge of PR #56 is already recorded in entry 18. No blockers reported.
