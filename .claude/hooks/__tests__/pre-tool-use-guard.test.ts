// @vitest-environment node
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

const projectDir = path.resolve(__dirname, "../../..");
const script = path.join(projectDir, ".claude/hooks/pre-tool-use-guard.mjs");

type ToolInput = Record<string, unknown>;

/** Pipe one PreToolUse payload into the guard script, as Claude Code does. */
function runGuard(toolName: string, toolInput: ToolInput, cwd = projectDir) {
  const payload = {
    hook_event_name: "PreToolUse",
    tool_name: toolName,
    tool_input: toolInput,
    cwd,
  };
  const result = spawnSync("node", [script], {
    input: JSON.stringify(payload),
    encoding: "utf8",
    cwd,
    env: { ...process.env, CLAUDE_PROJECT_DIR: projectDir },
  });
  return { code: result.status, stderr: result.stderr };
}

/** A throwaway git repo with one commit, checked out on the given branch. */
function makeRepo(branch: string) {
  const dir = mkdtempSync(path.join(tmpdir(), "guard-test-"));
  // Ignore the developer's own git config (signing, hooks, default branch).
  const env = {
    ...process.env,
    GIT_CONFIG_GLOBAL: "/dev/null",
    GIT_CONFIG_NOSYSTEM: "1",
  };
  const git = (...args: string[]) =>
    execFileSync("git", args, { cwd: dir, stdio: "ignore", env });
  git("init", "-q", "-b", "main");
  git(
    "-c",
    "user.name=test",
    "-c",
    "user.email=test@example.com",
    "-c",
    "commit.gpgsign=false",
    "commit",
    "-q",
    "--allow-empty",
    "-m",
    "init",
  );
  if (branch !== "main") git("checkout", "-q", "-b", branch);
  return dir;
}

const inProject = (relative: string) => path.join(projectDir, relative);

describe("blocks reading or printing .env files", () => {
  test.each([
    ["Read", { file_path: inProject(".env.local") }],
    ["Read", { file_path: inProject(".env") }],
    ["Grep", { pattern: "KEY", path: inProject(".env.local") }],
    ["Bash", { command: "cat .env.local" }],
    ["Bash", { command: "source .env && npm run dev" }],
    ["Bash", { command: "grep SUPABASE ./.env.development" }],
    // A name inside --flag=value.
    ["Bash", { command: "node --env-file=.env.local server.js" }],
  ])("%s %o", (tool, input) => {
    const { code, stderr } = runGuard(tool, input);
    expect(code).toBe(2);
    expect(stderr).toContain("secrets file (.env*)");
    expect(stderr).toContain(".env.example");
  });
});

describe("blocks editing AGENTS.md, package-lock.json and node_modules/", () => {
  test.each([
    ["Edit", { file_path: inProject("AGENTS.md") }],
    ["Write", { file_path: inProject("package-lock.json") }],
    ["Edit", { file_path: inProject("node_modules/next/dist/index.js") }],
    ["Bash", { command: "echo '# notes' >> AGENTS.md" }],
    ["Bash", { command: "sed -i '' 's/a/b/' package-lock.json" }],
    ["Bash", { command: "rm -r node_modules/vitest" }],
  ])("%s %o", (tool, input) => {
    const { code, stderr } = runGuard(tool, input);
    expect(code).toBe(2);
    expect(stderr).toContain("must not be edited by hand");
  });
});

describe("blocks pushing to main and force pushes", () => {
  let mainRepo: string;
  let featureRepo: string;

  beforeAll(() => {
    mainRepo = makeRepo("main");
    featureRepo = makeRepo("chore/24-hooks");
  });

  afterAll(() => {
    rmSync(mainRepo, { recursive: true, force: true });
    rmSync(featureRepo, { recursive: true, force: true });
  });

  test.each([
    "git push origin main",
    "git push origin HEAD:main",
    "git push origin feature:refs/heads/main",
    "npm test && git push origin main",
    // Global options and env prefixes before the subcommand.
    "git -c push.default=current push origin main",
    "git --git-dir=.git push origin main",
    "GIT_TRACE=1 git push origin main",
    "sleep 1 & git push origin main",
    // --all pushes every branch, main included.
    "git push --all origin",
  ])("push to main: %s", (command) => {
    const { code, stderr } = runGuard("Bash", { command }, featureRepo);
    expect(code).toBe(2);
    expect(stderr).toContain("pushing to main is not allowed");
  });

  test.each([
    "git push",
    "git push origin",
    "git push origin HEAD",
    "git push -u origin HEAD",
    "git push origin @",
  ])("push of the current branch while on main: %s", (command) => {
    const { code, stderr } = runGuard("Bash", { command }, mainRepo);
    expect(code).toBe(2);
    expect(stderr).toContain("pushing to main is not allowed");
  });

  test("git -C reads the branch of the repo it names", () => {
    const { code, stderr } = runGuard(
      "Bash",
      { command: `git -C ${mainRepo} push` },
      featureRepo,
    );
    expect(code).toBe(2);
    expect(stderr).toContain("pushing to main is not allowed");
  });

  test("git -C allows a bare push of a feature repo from a main checkout", () => {
    expect(
      runGuard("Bash", { command: `git -C ${featureRepo} push` }, mainRepo),
    ).toEqual({ code: 0, stderr: "" });
  });

  test.each([
    "git push --force",
    "git push -f origin chore/24-hooks",
    "git push --force-with-lease origin chore/24-hooks",
    "git push origin +chore/24-hooks",
  ])("force push: %s", (command) => {
    const { code, stderr } = runGuard("Bash", { command }, featureRepo);
    expect(code).toBe(2);
    expect(stderr).toContain("force pushes are not allowed");
  });

  test.each([
    "git push",
    "git push -u origin chore/24-hooks",
    "git push origin HEAD",
    "git push --follow-tags origin chore/24-hooks",
  ])("allows a normal push of a feature branch: %s", (command) => {
    expect(runGuard("Bash", { command }, featureRepo)).toEqual({
      code: 0,
      stderr: "",
    });
  });
});

describe("lets normal actions through", () => {
  test.each([
    ["Read", { file_path: inProject(".env.example") }],
    ["Read", { file_path: inProject("AGENTS.md") }],
    ["Read", { file_path: inProject("package-lock.json") }],
    ["Edit", { file_path: inProject("src/lib/entry-types.ts") }],
    ["Write", { file_path: inProject("docs/hooks/README.md") }],
    ["Grep", { pattern: "overseer", path: inProject("src") }],
    ["Bash", { command: "npm test" }],
    ["Bash", { command: "cat AGENTS.md" }],
    ["Bash", { command: "git diff package-lock.json" }],
    ["Bash", { command: "cat .env.example" }],
    ["Bash", { command: "npm install --save-dev prettier" }],
    ["Glob", { pattern: "**/*.ts" }],
  ])("%s %o", (tool, input) => {
    expect(runGuard(tool, input)).toEqual({ code: 0, stderr: "" });
  });
});
