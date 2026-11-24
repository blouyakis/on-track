# Hook evidence (issue #24)

The three Claude Code hooks are registered in `.claude/settings.json`, and their scripts are in `.claude/hooks/`. `CLAUDE.md` ("Hooks") describes what each one does.

| Hook             | Script                   | Fires on                                    |
| ---------------- | ------------------------ | ------------------------------------------- |
| PreToolUse guard | `pre-tool-use-guard.mjs` | Read, Grep, Edit, Write, NotebookEdit, Bash |
| PostToolUse      | `format-edited-file.sh`  | Edit, Write                                 |
| Stop             | `run-tests-on-stop.sh`   | the end of every Claude turn                |

## Files in this folder

- `format-and-stop-pipe-tests.txt`: the PostToolUse and Stop scripts run by hand with the same JSON Claude Code sends on stdin. It covers 10 cases:
  - formatting an edited file;
  - a syntax error reported back to Claude;
  - skipped file types;
  - passing tests;
  - failing tests blocking the stop;
  - the `stop_hook_active` guard;
  - skipping when only `docs/` changed.
- `guard-tests.txt`: the verbose output of the Vitest cases for the guard. There is at least one case per blocked rule, plus the normal actions it lets through. They run as part of `npm test`.
- `live-session.txt`: an exported Claude Code session in which all three hooks fire for real. A human captures it with the steps below.

## Seen during the session that built the hooks

The hooks were already active in the worker session that wrote them. Claude Code reported two things in that session:

- After a Write to `.claude/hooks/pre-tool-use-guard.mjs`, it said: "PostToolUse hook modified .../pre-tool-use-guard.mjs after your edit (likely a formatter)". This was the format hook.
- A Bash command whose text named `.env.local` was refused: "PreToolUse:Bash hook error: [node "$CLAUDE_PROJECT_DIR"/.claude/hooks/pre-tool-use-guard.mjs]: Blocked by the OnTrack guard hook: .env.local. is a secrets file (.env\*). ..." The name appeared only inside a prompt string, which shows the known false positive of string matching. The trailing dot in that message was fixed later.

## Capturing a live session

Run these steps in a fresh interactive session in this worktree.

The prompts never touch a real secret and never really push:

- the env file name is a dummy that does not exist;
- both pushes use `--dry-run`;
- the guard blocks all of them before they run.

1. Open a fresh session in this worktree:

   ```sh
   claude
   ```

   Accept the workspace trust dialog if it appears.

2. Type `/hooks` and check that PreToolUse, PostToolUse and Stop are listed with the source "project". Press Esc to close it.

3. **PostToolUse.** Paste this prompt:

   ```text
   Use the Write tool to create src/lib/zz-hook-demo.ts with exactly this line, keeping the odd spacing: export const   demo = {a:1,b:2}
   Then use the Read tool to read it back and quote what the file contains now.
   ```

   Expected: the file reads back as `export const demo = { a: 1, b: 2 };`. When the turn ends, the Stop hook runs the tests ("Running tests"). They pass, so it stays silent.

4. **PreToolUse guard.** Paste this prompt:

   ```text
   This checks the project's guard hook. Try each of these once, in order, and do not retry or work around a blocked one. Afterwards, list each with the exact reason you were given.
   1. Use the Read tool on the file .env.hook-demo (it is a dummy name, not a real file).
   2. Use the Edit tool to add a line "test" at the end of AGENTS.md.
   3. Run: git push --dry-run origin main
   4. Run: git push --dry-run --force origin chore/24-hooks
   5. Run: npm test
   ```

   Expected: steps 1 to 4 are blocked, and Claude quotes "Blocked by the OnTrack guard hook: ..." for each. Step 5 runs normally.

5. **Stop hook blocking.** Paste this prompt:

   ```text
   Create src/lib/__tests__/zz-hook-demo.test.ts containing a Vitest test named "hook demo" that expects 1 to be 2. Do not run the tests yourself. If a hook then reports failing tests, do not fix them; just say which test failed and stop.
   ```

   Expected: when the turn ends, the Stop hook blocks once with the vitest failure, shown as "Stop hook error" or "Stop hook feedback". Claude reports the failing test. On the next stop `stop_hook_active` is true, so the turn ends.

6. Export the session, then quit:

   ```text
   /export docs/hooks/live-session.txt
   ```

   If `/export` saves the file somewhere else, move it to `docs/hooks/live-session.txt`.

7. Clean up the demo files and confirm that `AGENTS.md` is unchanged. Never commit the demo files.

   ```sh
   rm src/lib/zz-hook-demo.ts src/lib/__tests__/zz-hook-demo.test.ts
   git status --short
   ```

   The expected output lists only `docs/hooks/live-session.txt`. If `AGENTS.md` shows up, restore it with `git checkout -- AGENTS.md`.

8. Commit the export:

   ```sh
   git add docs/hooks/live-session.txt
   git commit -m "docs: add the live session showing the hooks firing"
   ```
