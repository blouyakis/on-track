#!/usr/bin/env node
// PreToolUse hook: block the actions CLAUDE.md forbids, before they run.
//
// 1. Reading or printing .env* files (except .env.example), through a file
//    tool or a shell command, including globs and braces such as .en? or
//    {.env,x}.
// 2. Editing AGENTS.md, package-lock.json, or anything in node_modules/
//    (compared without case), by file tool or by shell write.
// 3. git push to main (also --all, --branches, ":" and wildcard refspecs,
//    and HEAD or a bare push while on main), and any force push. Wrappers
//    such as env, time, nohup or xargs and backslash line breaks are seen
//    through.
//
// Blocking exits 2 with the reason on stderr, which Claude reads. Everything
// else exits 0. An unexpected error inside the checks also exits 2 (fail
// closed); only unparseable stdin is let through.
//
// Known limits: this is string matching, so it is a guard rail, not a
// sandbox. It does not see through:
// - quoting tricks, variables, command substitution, eval, or scripts that
//   read or write files themselves (node, python, a .sh file);
// - git aliases, or wrappers that are not in WRAPPERS;
// - a `cd` earlier in the same command (paths and the branch check use the
//   hook's cwd, or the directory given with git -C).
// Globs are only tested against the known env names in ENV_CANDIDATES, not
// against the files on disk.
// Known false positives, which err toward blocking: any word that names an
// env file is blocked even inside quotes, such as a commit message or
// `cp .env.example .env.local`, and | ; & inside quotes still split a
// command, so a quoted "| git push origin main" is treated as a push. Rephrase
// the command when this happens.
// The permission deny rules in settings.json stay as a second layer.

import { execFileSync } from "node:child_process";
import path from "node:path";

const FILE_TOOLS = new Set([
  "Read",
  "Edit",
  "Write",
  "MultiEdit",
  "NotebookEdit",
  "Grep",
]);
const EDIT_TOOLS = new Set(["Edit", "Write", "MultiEdit", "NotebookEdit"]);

// Env file names a glob is tested against.
const ENV_CANDIDATES = [
  ".env",
  ".env.local",
  ".env.development",
  ".env.development.local",
  ".env.production",
  ".env.production.local",
  ".env.test",
  ".env.test.local",
  ".envrc",
  ".env-local",
  ".env_local",
];

/** Convert a shell glob, including {a,b} braces, to an anchored regular expression. */
function globToRegExp(glob) {
  let source = "";
  let braceDepth = 0;
  for (let i = 0; i < glob.length; i++) {
    const char = glob[i];
    if (char === "*") source += "[^/]*";
    else if (char === "?") source += "[^/]";
    else if (char === "{" && glob.indexOf("}", i + 1) !== -1) {
      source += "(?:";
      braceDepth++;
    } else if (char === "}" && braceDepth > 0) {
      source += ")";
      braceDepth--;
    } else if (char === "," && braceDepth > 0) source += "|";
    else if (char === "[") {
      const end = glob.indexOf("]", i + 1);
      if (end === -1) source += "\\[";
      else {
        source += "[" + glob.slice(i + 1, end).replace(/^!/, "^") + "]";
        i = end;
      }
    } else source += char.replace(/[.+^${}()|\\]/g, "\\$&");
  }
  return new RegExp("^" + source + "$");
}

/**
 * True for any name that starts with .env (.env.local, .envrc, .env-local)
 * except .env.example, and for a glob (such as .en? or {.env,x}) that would
 * match one of the known env names in ENV_CANDIDATES.
 */
export function isEnvFile(name) {
  const base = path.basename(name);
  if (base === ".env.example") return false;
  if (base.startsWith(".env")) return true;
  // Only a glob that can start with a dot can match a dotfile.
  if (/[*?[{]/.test(base) && /^[.{[]/.test(base)) {
    // An invalid glob such as [z-a] throws here; main() then fails closed.
    // An unclosed { is taken literally, so awk '{print $1}' still runs.
    const pattern = globToRegExp(base);
    return ENV_CANDIDATES.some((candidate) => pattern.test(candidate));
  }
  return false;
}

/**
 * True for AGENTS.md or package-lock.json at the root, or anything in
 * node_modules/. Compared without case, because the default macOS disk
 * treats agents.md and AGENTS.md as the same file.
 */
export function isProtectedFile(relativePath) {
  const normalized = relativePath
    .split(path.sep)
    .join("/")
    .replace(/^\.\//, "")
    .toLowerCase();
  return (
    normalized === "agents.md" ||
    normalized === "package-lock.json" ||
    normalized.split("/").includes("node_modules")
  );
}

/** Remove sentence punctuation after a word, keeping words made only of dots. */
function stripTrailing(word) {
  const stripped = word.replace(/[.,:;]+$/, "");
  return stripped === "" ? word : stripped;
}

/** Split a shell command into words on whitespace, quotes and operators (not on =). */
function shellWords(command) {
  return command
    .split(/[\s"'`<>|;&()]+/)
    .map(stripTrailing)
    .filter(Boolean);
}

/** Split a shell command into simple segments on && || ; | & and newlines. */
function shellSegments(command) {
  return (
    command
      // A | right after > is the >| redirection, not a pipe.
      .split(/&&|\|\||(?<!>)\||[;&\n]/)
      .map((segment) => segment.trim())
      .filter(Boolean)
  );
}

// Commands that run another command, with their options that take a value.
const WRAPPERS = new Map([
  ["env", new Set(["-u", "-C", "-S", "--unset", "--chdir"])],
  ["time", new Set()],
  ["command", new Set()],
  ["builtin", new Set()],
  ["nohup", new Set()],
  ["exec", new Set(["-a"])],
  ["sudo", new Set(["-u", "-g", "-C", "-D", "-h"])],
  ["nice", new Set(["-n"])],
  ["xargs", new Set(["-I", "-L", "-n", "-P", "-s", "-E", "-d"])],
  ["{", new Set()],
  ["!", new Set()],
]);

/**
 * Skip what comes before the real command: VAR=value assignments, as in
 * GIT_TRACE=1 git push, and wrappers such as env, time, nohup or xargs.
 */
function skipCommandPrefix(words) {
  let index = 0;
  for (;;) {
    while (
      index < words.length &&
      /^[A-Za-z_][A-Za-z0-9_]*=/.test(words[index])
    ) {
      index++;
    }
    const valueOptions = WRAPPERS.get(words[index] ?? "");
    if (valueOptions === undefined) break;
    index++;
    while (index < words.length && words[index].startsWith("-")) {
      index += valueOptions.has(words[index]) ? 2 : 1;
    }
  }
  return words.slice(index);
}

function envReason(target) {
  return (
    `Blocked by the OnTrack guard hook: ${target} is a secrets file (.env*). ` +
    "CLAUDE.md forbids reading or printing .env files. Use .env.example for the variable names, " +
    "or ask the user to check the value."
  );
}

function protectedReason(target) {
  return (
    `Blocked by the OnTrack guard hook: ${target} must not be edited by hand. ` +
    "AGENTS.md is regenerated by `next dev`, package-lock.json is managed by npm (use npm install), " +
    "and node_modules/ is installed by npm ci."
  );
}

function checkFileTool(toolName, toolInput, cwd, projectDir) {
  if (typeof toolInput.glob === "string" && isEnvFile(toolInput.glob)) {
    return envReason(toolInput.glob);
  }
  const raw = toolInput.file_path ?? toolInput.notebook_path ?? toolInput.path;
  if (typeof raw !== "string" || raw === "") return null;
  if (isEnvFile(raw)) return envReason(raw);
  if (EDIT_TOOLS.has(toolName)) {
    const relative = path.relative(projectDir, path.resolve(cwd, raw));
    if (isProtectedFile(relative)) return protectedReason(relative);
  }
  return null;
}

// Commands that change every file they name.
const WRITES_ALL_ARGS = /^(tee|rm|mv|truncate|touch|chmod)$/;
// Commands whose last argument is the destination; the others are only read.
const WRITES_LAST_ARG = /^(cp|ln|install)$/;

/** Resolve a shell path argument to a path relative to the project. */
function projectRelative(word, cwd, projectDir) {
  const expanded = word.replace(/\$\{?CLAUDE_PROJECT_DIR\}?/g, projectDir);
  return path.relative(projectDir, path.resolve(cwd, expanded));
}

/**
 * The files a sed -i or perl -i command edits: its operands without the
 * script, which is the value of -e (or -pe, --expression) or, with no -e,
 * the first operand.
 */
function inPlaceFiles(args) {
  const files = [];
  let hasScriptOption = false;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (/^-[a-zA-Z]*e$/.test(arg) || arg === "--expression") {
      hasScriptOption = true;
      i++;
    } else if (!arg.startsWith("-")) files.push(arg);
  }
  return hasScriptOption ? files : files.slice(1);
}

function checkProtectedWrites(segment, cwd, projectDir) {
  const isProtected = (word) =>
    isProtectedFile(projectRelative(word, cwd, projectDir));

  // Redirection into a protected file: echo x > AGENTS.md, >> and >| too.
  for (const match of segment.matchAll(/>>?\|?\s*["']?([^\s"'|;&]+)/g)) {
    if (isProtected(match[1])) return protectedReason(match[1]);
  }
  const words = skipCommandPrefix(shellWords(segment));
  const command = words[0] === undefined ? "" : path.basename(words[0]);
  const operands = words.slice(1).filter((word) => !word.startsWith("-"));
  const inPlace =
    (command === "sed" || command === "perl") &&
    words.some(
      (word) => /^-[a-zA-Z]*i/.test(word) || word.startsWith("--in-place"),
    );

  let targets = [];
  if (inPlace) targets = inPlaceFiles(words.slice(1));
  else if (WRITES_ALL_ARGS.test(command)) targets = operands;
  else if (WRITES_LAST_ARG.test(command)) {
    // cp -t <dir> and --target-directory=<dir> name the destination first.
    const flagIndex = words.indexOf("-t");
    const longFlag = words.find((word) =>
      word.startsWith("--target-directory="),
    );
    if (flagIndex !== -1 && flagIndex + 1 < words.length) {
      targets = [words[flagIndex + 1]];
    } else if (longFlag !== undefined) {
      targets = [longFlag.slice("--target-directory=".length)];
    } else targets = operands.slice(-1);
  }
  const target = targets.find(isProtected);
  return target === undefined ? null : protectedReason(target);
}

function currentBranch(cwd) {
  try {
    return execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
}

const FORCE_FLAGS =
  /^(-f|--force|--force-with-lease(=.*)?|--force-if-includes|--mirror|-[a-zA-Z]*f[a-zA-Z]*)$/;

// git global options that take a separate value: git -C <dir>, git -c <k=v>.
const GLOBAL_OPTIONS_WITH_VALUE = new Set([
  "-C",
  "-c",
  "--git-dir",
  "--work-tree",
  "--namespace",
  "--exec-path",
  "--config-env",
]);

// git push options that take a separate value, which is not a refspec.
const PUSH_OPTIONS_WITH_VALUE = new Set([
  "-o",
  "--push-option",
  "--repo",
  "--receive-pack",
  "--exec",
]);

function checkGitPush(segment, cwd) {
  const words = skipCommandPrefix(shellWords(segment));
  if (words.length === 0 || path.basename(words[0]) !== "git") return null;
  // Walk the global options before the subcommand, remembering git -C <dir>.
  let repoDir = cwd;
  let index = 1;
  while (index < words.length && words[index].startsWith("-")) {
    const option = words[index];
    if (option === "-C" && index + 1 < words.length) {
      repoDir = path.resolve(repoDir, words[index + 1]);
    }
    index += GLOBAL_OPTIONS_WITH_VALUE.has(option) ? 2 : 1;
  }
  if (words[index] !== "push") return null;
  const args = words.slice(index + 1);

  if (
    args.some((arg) => FORCE_FLAGS.test(arg)) ||
    args.some((arg) => arg.startsWith("+"))
  ) {
    return (
      "Blocked by the OnTrack guard hook: force pushes are not allowed. " +
      "CLAUDE.md forbids force-pushing or rewriting published history. Push a new commit instead."
    );
  }
  // The words that are not options or option values: the remote, then refspecs.
  const refspecs = [];
  for (let i = 0; i < args.length; i++) {
    if (PUSH_OPTIONS_WITH_VALUE.has(args[i])) i++;
    else if (!args[i].startsWith("-")) refspecs.push(args[i]);
  }
  const toMain =
    // --all and --branches push every local branch, main included.
    args.includes("--all") ||
    args.includes("--branches") ||
    refspecs.some(
      (ref) =>
        ref === "main" ||
        ref.endsWith(":main") ||
        ref.endsWith("refs/heads/main") ||
        // ":" pushes every matching branch; a wildcard can match main.
        ref === ":" ||
        ref.includes("*"),
    );
  // Without a refspec (git push, git push origin), or with HEAD or @, git
  // pushes the current branch.
  const pushesCurrent =
    refspecs.length <= 1 ||
    refspecs.slice(1).some((ref) => ref === "HEAD" || ref === "@");
  const currentOnMain = pushesCurrent && currentBranch(repoDir) === "main";
  if (toMain || currentOnMain) {
    return (
      "Blocked by the OnTrack guard hook: pushing to main is not allowed. " +
      "Every change reaches main through a pull request. Push a feature branch and open a PR."
    );
  }
  return null;
}

function checkBash(rawCommand, cwd, projectDir) {
  // Join lines continued with a trailing backslash into one command.
  const command = rawCommand.replace(/\\\r?\n/g, " ");
  for (const word of shellWords(command)) {
    // Also look inside --flag=value and VAR=value words.
    for (const part of word.split("=")) {
      if (isEnvFile(part)) return envReason(part);
    }
  }
  for (const segment of shellSegments(command)) {
    const reason =
      checkProtectedWrites(segment, cwd, projectDir) ??
      checkGitPush(segment, cwd);
    if (reason !== null) return reason;
  }
  return null;
}

/** Return the reason to block this tool call, or null to allow it. */
export function guard(input, projectDir) {
  if (input === null || typeof input !== "object") return null;
  const toolName = input.tool_name;
  const toolInput = input.tool_input ?? {};
  const cwd = typeof input.cwd === "string" ? input.cwd : projectDir;
  if (FILE_TOOLS.has(toolName))
    return checkFileTool(toolName, toolInput, cwd, projectDir);
  if (toolName === "Bash" && typeof toolInput.command === "string") {
    return checkBash(toolInput.command, cwd, projectDir);
  }
  return null;
}

async function main() {
  let raw = "";
  for await (const chunk of process.stdin) raw += chunk;
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    process.exit(0);
  }
  const projectDir = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
  let reason;
  try {
    reason = guard(input, projectDir);
  } catch (error) {
    // Fail closed: an unexpected error blocks the call.
    reason =
      "Blocked by the OnTrack guard hook: the guard itself failed, so the call was blocked to be safe. " +
      `Error: ${error instanceof Error ? error.message : String(error)}`;
  }
  if (reason !== null) {
    process.stderr.write(reason + "\n");
    process.exit(2);
  }
  process.exit(0);
}

main();
