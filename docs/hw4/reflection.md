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

### `/compact` helped, but quality dropped afterwards

We also tried `/compact`. In the issue #3 session we ran it at a milestone
chosen in advance (all pure logic green) and gave it an explicit "Keep" list
with the issue, branch, decisions, finished commits and remaining work.
That kept the session going, and the next commits followed the plan.

However, in the **five or six turns after a compact, the quality of the
output dropped**, and some wrong details appeared. In the issue #3 session,
both bugs fixed in `9746ffa` came from code written right after the compact.
One wrapped the server action in a client function, although the plan said
to pass it straight to `useActionState`. The other was a prerendering
problem in exactly the area of the Next.js docs read before the compact. We
cannot prove the summary caused these bugs, but it matches what we saw in
other sessions too: a summary keeps the decisions but loses the details
behind them. Our conclusion is that `/clear`, with the plan and decisions
saved in files, is more reliable than `/compact`. If we do compact, we check
the next few turns more closely.

### Other things that helped

- **`claude --continue`** was the right tool for resuming the *same* task
  after quitting. It brought back the whole conversation and the list of
  open items without a new prompt. It does not bring back background
  processes: the dev server had stopped and needed to be started again.
- **CLAUDE.md with `@import`** works as context that survives `/clear`. The
  PRD's "Rules the logic must enforce" are imported into every session, so
  even a cleared session knows the business rules and our conventions. We
  first generated CLAUDE.md with `/init`, and then rewrote it to add
  architecture decisions, TDD rules and do's and don'ts that `/init` could not
  infer from the code.
- **Permissions** reduced noise. Routine commands (tests, lint, type check,
  `git diff`) run without prompts, so our attention goes to the prompts that
  matter, such as `git commit` and `npm install`. Reading `.env` files is
  denied: in the issue #3 session, Claude tried to read `.env.example` along
  with other files, and the rule blocked it.

## 3. What we would do next time

- Spend more time reviewing the plan than reviewing the code, since that is
  where most of our corrections happened.
- Prefer `/clear` with a saved plan file over `/compact`. If we do compact,
  test the next few changes more carefully.
- Ask for verification and for an explicit "not verified" list in every
  plan.

## Annotated session logs

- [`visibility-tdd-session-annotated.md`](visibility-tdd-session-annotated.md):
  Part 3, TDD for the visibility rules (Ziye).
- [`entry-form-log-session-annotated.md`](entry-form-log-session-annotated.md):
  Part 2, Explore → Plan → Implement → Commit for the entry form, including
  `/clear`, `/compact` and `--continue` (Barbara's session).

The full index of evidence is in [`README.md`](README.md).
