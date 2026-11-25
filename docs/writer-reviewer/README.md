# Writer/reviewer pull requests

Evidence for the writer/reviewer pattern: one Claude Code session writes a pull request, and a separate session reviews it with the C.L.E.A.R. framework. Issue #29 covers the Sprint 1 PR, and #38 will cover the Sprint 2 one.

## C.L.E.A.R.

From the Week 11 lecture (Claude Code extensibility):

| Part | Question | Check | AI-specific risk |
| --- | --- | --- | --- |
| **C**ontext | Does this code fit the project's architecture and conventions? | Fits conventions? Uses the right patterns? | AI may invent its own conventions. |
| **L**ogic | Is the business logic correct? Are edge cases handled? | Edge cases? Error handling? | AI often handles only the happy path. |
| **E**vidence | Are there tests? Do they actually verify the behavior? | Tests exist? Tests are meaningful? | AI writes tests that pass but don't verify behavior. |
| **A**rchitecture | Does it follow established patterns? Any new dependencies? | Follows patterns? No new deps? | AI adds unnecessary libraries. |
| **R**isk | Security issues? Performance concerns? Data exposure? | Injection? XSS? Auth checks? | AI code has about 1.57x more security issues. |

The pattern has four steps: write, review by a separate agent using C.L.E.A.R., revise, and human review.

## Sprint 1: PR #61 (issue #29)

- **Writer:** Barbara's Claude Code session, through the `/add-feature` skill, wrote PR #61 (#20, sign up, sign in and sign out). Its AI disclosure is in the PR description.
- **Reviewer:** Ziye ran a separate Claude Code session (Claude Opus 5.5). That session gave the review to an independent general-purpose sub-agent with the C.L.E.A.R. framework and the project rules, but none of its own conclusions. It then checked each finding against the code, kept four, and dropped two it could not confirm, with the reasons.
- **Human review:** Ziye read every finding and asked for three revisions before posting: keep the sign-up enumeration point but soften it into a question about the hosted project (#28), shorten the review, and post one overall comment instead of inline comments.
- **Posted review:** [approving review on #61](https://github.com/blouyakis/on-track/pull/61#pullrequestreview-6052903707), one comment with a heading per C.L.E.A.R. part. It raises three questions and one nit, all non-blocking.

### Files

- [`pr-61-review-session.txt`](pr-61-review-session.txt): the reviewing session, exported with `/export`. It shows the prompt, the sub-agent call and its result, the verification, Ziye's three revision requests, and the posting.
- [`pr-61-sub-agent.txt`](pr-61-sub-agent.txt): the sub-agent's own run, rendered from its transcript: the prompt it was given, every command it ran, and the full report it handed back. Command output is cut to 400 characters.

Local paths are replaced with `<repo>`, `<scratchpad>` and `<session>`.
