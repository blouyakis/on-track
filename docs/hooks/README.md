# Hook evidence (issue #24)

The three Claude Code hooks are registered in `.claude/settings.json`, and their scripts are in `.claude/hooks/`. `CLAUDE.md` ("Hooks") describes what each one does.

| Hook             | Script                    | Fires on                                   |
| ---------------- | ------------------------- | ------------------------------------------ |
| PreToolUse guard | `pre-tool-use-guard.mjs`  | Read, Grep, Edit, Write, NotebookEdit, Bash |
| PostToolUse      | `format-edited-file.sh`   | Edit, Write                                |
| Stop             | `run-tests-on-stop.sh`    | the end of every Claude turn               |

## Files in this folder

- `format-and-stop-pipe-tests.txt`: the PostToolUse and Stop scripts run by hand with the same JSON Claude Code sends on stdin. It covers 10 cases: formatting, a syntax error reported back, skipped file types, passing tests, failing tests blocking the stop, the `stop_hook_active` guard, and skipping when only `docs/` changed.
- `guard-tests.txt`: the verbose output of the 36 Vitest cases for the guard. There is one or more case per blocked rule, plus the normal actions it lets through. They run as part of `npm test`.
- `live-session-*.txt`: an exported Claude Code session in which the hooks fire for real (see "Capturing a live session" below).

## Seen during the session that built the hooks

The hooks were already active in the worker session that wrote them. Two things Claude Code reported in that session:

- After a Write to `.claude/hooks/pre-tool-use-guard.mjs`, it reported: "PostToolUse hook modified .../pre-tool-use-guard.mjs after your edit (likely a formatter)". This was the format hook.
- A Bash command whose text named `.env.local` was refused with: "PreToolUse:Bash hook error: [node "$CLAUDE_PROJECT_DIR"/.claude/hooks/pre-tool-use-guard.mjs]: Blocked by the OnTrack guard hook: .env.local. is a secrets file (.env\*). CLAUDE.md forbids reading or printing .env files. ..." The name appeared only inside a prompt string, which shows the known false positive of string matching.

## Capturing a live session

Do this in a fresh interactive session in this worktree.

1. Run `claude`, accept the workspace trust dialog, and check `/hooks`. It should list PreToolUse, PostToolUse and Stop from "project".
2. Ask: "Create `src/lib/zz-hook-demo.ts` with exactly `export const   demo = {a:1,b:2}`, then read it back." The PostToolUse hook reformats it to `export const demo = { a: 1, b: 2 };`.
3. Ask: "Read `.env.local`", then "Add a line to AGENTS.md", then "Run `git push --dry-run origin main`", then "Run `git push --force --dry-run`". Each is blocked, and Claude quotes the guard's reason.
4. Ask: "Add `src/lib/__tests__/zz-hook-demo.test.ts` with a test that expects 1 to be 2. Don't run the tests, and if a hook reports failures don't fix them, just say so." When the turn ends, the Stop hook blocks it once with the vitest failure. Claude reports it, and on the next stop `stop_hook_active` lets it finish.
5. Run `/export docs/hooks/live-session-<date>.txt`, then delete the two `zz-hook-demo` files. Never commit them.
