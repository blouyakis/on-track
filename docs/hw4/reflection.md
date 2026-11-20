# HW4 Reflection: Claude Code Workflow and TDD

CS6983 AI Coding, Fall 2026 · OnTrack (Project 3)
Barbara (Bobbi) Louyakis, Ziye Huang

## 1. How does Explore → Plan → Implement → Commit compare to our previous approach?

### What we did before

Before this project, our AI coding sessions followed the same loop. We
talked with the AI briefly about what we wanted, and as soon as the idea
felt clear, we told it to start writing code. Problems then showed up during
the coding: the UI was not what we had in mind, a feature we had assumed was
missing, or the AI had made a design decision we would not have made. Each
one meant explaining again and rewriting generated code. Most of our time
went into correcting the result, not building the feature.

### What changed with the four phases

The biggest difference is that **Plan** became a separate step with an
approval gate, and that a thorough **Explore** fed it. We now think these
two phases matter most. Once they are done well, Implement and Commit become
much easier, because most decisions have already been made.

- **Issue #3 (entry form and project log, Part 2).** During Explore, Claude
  read the database migration and found that Row Level Security gives a
  signed-out request no data, and the app had no sign-in yet. Under our old
  approach, the AI would have built a form that could not save anything. Here
  the problem surfaced before any code existed. In Plan mode, Claude offered
  three ways to reach the data, each with its cost, and we chose signing in a
  seeded demo user because it keeps every database rule in force. The
  approved plan was committed first (`494b452`), so the history shows the
  plan before the code.
- **Issue #4 (visibility rules, Part 3).** The plan surfaced that the
  visibility functions should match the RLS policies in a pull request that
  had not been merged yet (PR #6). We aligned the two before writing tests,
  instead of discovering the mismatch in review.

Explore has to be thorough, because a plan is only as good as what it is
based on. Our project runs Next.js 16.4, whose caching and data fetching
differ from what the model learned in training, so CLAUDE.md tells Claude to
read the bundled docs first. When it did, the plan already used the right
patterns, such as `<Suspense>` around components that read cookies. When this
step is skipped, the AI fills the gaps with patterns from older versions.

The plan also made the work easier to review. It listed the commits in
advance, so with TDD the history reads as plan, failing test,
implementation, fix. Reviewing a partner's pull request meant checking each
commit against the plan, not reading one large diff.

The workflow has costs. Explore and Plan took about ten minutes before the
first line of code for issue #3. It also does not guarantee correct code:
testing against the local database still found two bugs (fixed in
`9746ffa`). But these were small fixes inside the agreed design, not changes
to the design itself.

## 2. Which context management strategies worked best?

### `/clear` was the most effective

The strategy that helped most was **clearing the context early and often**.
We start every new task with `/clear`, so the model works only from
CLAUDE.md, the PRD it imports, the issue and the prompt, with no leftover
details from an unrelated task. We kept to one issue per session and one
branch per issue. For picking up the *same* task after quitting, we used
`claude --continue`, which brought back the conversation and its list of
open items without a new prompt. It does not restore background processes,
so the dev server had to be started again.

### Files are the memory, not the conversation

`/clear` only works if nothing important lives *only* in the conversation,
so we moved that information into files that every new session reads:

- **CLAUDE.md with `@import`.** It survives every `/clear`, and the imported
  PRD puts the "Rules the logic must enforce" in every session. We generated
  CLAUDE.md with `/init`, then rewrote it to add architecture decisions, TDD
  rules and do's and don'ts that `/init` could not infer from the code. A rule
  we repeated in prompts was a sign it belonged in CLAUDE.md.
- **The approved plan, committed to the repo.** Decisions made in Plan mode,
  such as dev sign-in instead of bypassing RLS, did not depend on the
  conversation staying in context.
- **GitHub issues with acceptance criteria.** Each session started by reading
  its issue, so the scope came from the issue, not from an earlier chat.

The first prompt of each session did the rest of the scoping: it named the
files and docs to explore, listed the open questions, and gave a short
"context from the previous session" list. This kept Explore focused on what
the task needed instead of the whole repository.

### Keep large material out of the context window

When Barbara rebuilt the first part of her session log from Claude Code's
2.7 MB transcript file, she told Claude not to read the file into context.
Claude sampled its structure and wrote a small script to convert it instead.
Long command output was handled the same way: we asked for the last few
lines of a test run, not the full output. Permissions helped too. Routine
commands run without prompts, so our attention went to the prompts that
mattered, and reading `.env` files is denied, which keeps secrets out of the
context. In the issue #3 session, that rule blocked an attempt to read
`.env.example`.

## Annotated session logs

- [`entry-form-log-session-annotated.md`](entry-form-log-session-annotated.md):
  Part 2, Explore → Plan → Implement → Commit for the entry form (Barbara's
  session).
- [`visibility-tdd-session-annotated.md`](visibility-tdd-session-annotated.md):
  Part 3, TDD for the visibility rules (Ziye's session).
