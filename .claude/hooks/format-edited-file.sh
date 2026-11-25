#!/usr/bin/env bash
# PostToolUse hook: format the file Claude just edited with Prettier.
#
# Reads the hook JSON from stdin and formats tool_input.file_path. Files that
# Prettier does not handle (--ignore-unknown) and files listed in
# .prettierignore are skipped. A Prettier failure exits 2 so Claude sees the
# message; PostToolUse cannot undo the edit, it only informs.
set -u

project_dir="${CLAUDE_PROJECT_DIR:-$(pwd)}"

file_path="$(node -e '
let raw = "";
process.stdin.on("data", (chunk) => (raw += chunk));
process.stdin.on("end", () => {
  try {
    const input = JSON.parse(raw);
    const p = input && input.tool_input && input.tool_input.file_path;
    if (typeof p === "string") process.stdout.write(p);
  } catch {
    // Not JSON: nothing to format.
  }
});
')"

# Nothing to do without a path, or if the file is gone.
[ -n "$file_path" ] || exit 0
[ -f "$file_path" ] || exit 0

# Only format files inside this project.
case "$file_path" in
  "$project_dir"/*) ;;
  *) exit 0 ;;
esac

prettier="$project_dir/node_modules/.bin/prettier"
[ -x "$prettier" ] || exit 0

cd "$project_dir" || exit 0
if ! output="$("$prettier" --write --ignore-unknown --log-level warn "$file_path" 2>&1)"; then
  echo "Prettier could not format $file_path:" >&2
  echo "$output" >&2
  exit 2
fi
exit 0
