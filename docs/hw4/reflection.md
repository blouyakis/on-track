# HW4 Reflection: Claude Code Workflow and TDD

CS6983 AI Coding, Fall 2026 · OnTrack (Project 3)
Barbara (Bobbi) Louyakis, Ziye Huang

## 1. How does Explore → Plan → Implement → Commit compare to our previous approach?

### What we did before

Before this project, our AI coding sessions followed the same loop. We
started by talking with the AI about what we wanted, but that conversation
was short and not thorough. As soon as the idea felt clear, we told the AI to
start writing code. Problems then showed up while the code was being
written: the UI was not what we had in mind, a feature we had assumed was
missing, or the AI had made a design decision we would not have made. Each
of these meant going back, explaining again, and rewriting code that had
already been generated. Most of our time went into correcting the result,
not into building the feature.

### What changed with the four phases

The biggest difference is that **Plan** became a separate step with an
approval gate, and that **Explore** fed it. We now think these two phases
are the most important part of the workflow. Once they are done well,
Implement and Commit become much easier, because most of the decisions have
already been made.

Two examples from this homework show this:

- **Issue #3 (entry form and project log, Part 2).** During Explore, Claude
  read the database migration and found that Row Level Security gives a
  signed-out request no data at all. The app had no sign-in yet. Under our
  old approach, the AI would have built a form that could not save anything,
  and we would have found out only when we tried it. Here, the problem
  surfaced before any code existed. In Plan mode, Claude gave us three ways
  to reach the data, each with its cost (bypass RLS with a secret key, weaken
  RLS with a temporary policy, or sign in a seeded demo user). We chose the
  demo user because it keeps every database rule in force. The approved plan
  was committed first (`494b452`), so the history shows the plan before the
  code.
- **Issue #4 (visibility rules, Part 3).** The plan surfaced that the
  visibility functions should match the RLS policies in a pull request that
  had not been merged yet (PR #6). We aligned the two before writing tests,
  instead of discovering the mismatch in review.

Explore also needs to be thorough. A plan is only as good as what it is based on. Our
project runs Next.js 16.4, whose caching and data fetching differ from what
the model learned in training, so CLAUDE.md tells Claude to read the bundled
docs first. When it did, the plan already had the right patterns
(`<Suspense>` around components that read cookies, `refresh()` after a
mutation). When we skip this step, the AI fills the gaps with patterns from older versions.

The plan also made Implement and Commit easier to review. It listed the
commits in advance, so each commit matched a planned step. Combined with
TDD, the history reads as a sequence: plan, failing test, implementation,
fix. Reviewing a partner's pull request meant checking each commit against
the plan, not reading one large diff.

### What the workflow does not solve

The workflow is not free. Explore and Plan took about ten minutes before the
first line of code for issue #3, and some of that time went into reading
docs and answering questions. It also does not guarantee correct code:
verifying against the local database still found two bugs, fixed in
`9746ffa`. The difference is that these were small fixes inside an agreed
design, not changes to the design itself. We still have to review every
plan carefully. A plan we approve without reading only delays the problems
until later.

## 2. Which context management strategies worked best?

### `/clear` was the most effective

The strategy that helped most was **clearing the context early and often**.
We start every new task, and every new issue, with `/clear`. The model then
works only from CLAUDE.md, the PRD it imports, the issue, and the prompt,
with no leftover details from an unrelated task. Anything worth keeping from
a previous session goes into a file or into the first prompt: the approved
plan in `docs/hw4/`, the GitHub issue's acceptance criteria, or a short
"context from the previous session" list. These are the same sources a new
session would read anyway, so clearing loses nothing important.

### Files are the memory, not the conversation

`/clear` only works if nothing important lives *only* in the conversation.
We moved that information into files that any new session reads:

- **CLAUDE.md with `@import`.** This is the context that survives every
  `/clear`. The PRD is imported, so its "Rules the logic must enforce" are in
  every session. We first generated CLAUDE.md with `/init`, then rewrote it to
  add architecture decisions, TDD rules and do's and don'ts that `/init` could
  not infer from the code. A rule we repeated in a prompt more than once was a
  sign it belonged in CLAUDE.md.
- **The approved plan, committed to the repo.** Saving the plan in
  `docs/hw4/` meant the decisions from Plan mode (for example, dev sign-in
  instead of bypassing RLS) did not depend on the conversation staying in
  context.
- **GitHub issues with acceptance criteria.** Each session started by reading
  its issue, so the scope came from the issue, not from our memory of an
  earlier chat.

### One task per session, with a focused first prompt

We kept to one issue per session and one branch per issue. The first prompt
did the scoping: it named the files and docs to explore, listed the open
questions, and gave a short "context from the previous session" list
instead of relying on old conversation. This kept Explore focused on what
the task needed, rather than reading the whole repository.

### Keep large material out of the context window

Some inputs are too big to read directly. When Barbara rebuilt the first
part of her session log from Claude Code's 2.7 MB transcript file, she told
Claude not to read the file into context. Claude sampled its structure and
wrote a small script to convert it instead. Long command output was handled
the same way: we asked for the last few lines of a test run (`tail`), not
the full output.

### Resuming the same task: `claude --continue`

`claude --continue` was the right tool for picking up the *same* task after
quitting. It brought back the conversation and the list of open items
without a new prompt. It does not bring back background processes: the dev
server had stopped and had to be started again. For a *new* task we always
used `/clear` instead.

### Permissions reduce noise

Routine commands (tests, lint, type check, `git diff`) run without prompts,
so our attention goes to the prompts that matter, such as `git commit` and
`npm install`. Reading `.env` files is denied: in the issue #3 session,
Claude tried to read `.env.example` along with other files, and the rule
blocked it, which also keeps secrets out of the context.

## 3. What we would do next time

- Spend more time reviewing the plan than reviewing the code, since that is
  where most of our corrections happened.
- Keep using `/clear` for every new task, and write anything worth keeping
  into CLAUDE.md, the plan file or the issue before clearing.
- Ask for verification and for an explicit "not verified" list in every
  plan.

## Annotated session logs

- [`visibility-tdd-session-annotated.md`](visibility-tdd-session-annotated.md):
  Part 3, TDD for the visibility rules (Ziye).
- [`entry-form-log-session-annotated.md`](entry-form-log-session-annotated.md):
  Part 2, Explore → Plan → Implement → Commit for the entry form (Barbara's
  session).

The full index of evidence is in [`README.md`](README.md).
