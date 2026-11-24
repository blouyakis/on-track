#!/usr/bin/env bash
# Stop hook: run the unit tests before Claude finishes a turn.
#
# - If Claude is already continuing because of this hook (stop_hook_active),
#   exit 0 so it can stop. This prevents an endless loop when tests stay red.
# - If the working tree has no changes outside docs/, skip the run.
# - Tests pass: exit 0 silently. Tests fail: exit 2 with the end of the
#   output on stderr, which blocks the stop once and feeds the failure back.
set -u

project_dir="${CLAUDE_PROJECT_DIR:-$(pwd)}"

stop_hook_active="$(node -e '
let raw = "";
process.stdin.on("data", (chunk) => (raw += chunk));
process.stdin.on("end", () => {
  try {
    const input = JSON.parse(raw);
    process.stdout.write(input && input.stop_hook_active === true ? "true" : "false");
  } catch {
    process.stdout.write("false");
  }
});
')"

[ "$stop_hook_active" = "true" ] && exit 0

cd "$project_dir" || exit 0

# Skip when nothing outside docs/ has changed (staged, unstaged or untracked).
changed="$(git status --porcelain --untracked-files=all 2>/dev/null | cut -c4- | grep -v '^docs/' || true)"
[ -n "$changed" ] || exit 0

if output="$(npx --no-install vitest run 2>&1)"; then
  exit 0
fi

{
  echo "Tests failed (npm test). Fix them before finishing, or explain why they fail."
  echo "Last lines of the vitest output:"
  echo "$output" | tail -n 60
} >&2
exit 2
