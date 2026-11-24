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
    // Shell globs that expand to env files.
    ["Bash", { command: "cat .env*" }],
    ["Bash", { command: "cat .en?" }],
    ["Bash", { command: "cat .env.[a-z]*" }],
    // Grep through its glob parameter instead of path.
    ["Grep", { pattern: "KEY", path: inProject("."), glob: ".env*" }],
    ["Grep", { pattern: "KEY", path: inProject("."), glob: "**/.env.local" }],
  ])("%s %o", (tool, input) => {
    const { code, stderr } = runGuard(tool, input);
    expect(code).toBe(2);
    expect(stderr).toContain("secrets file (.env*)");
    expect(stderr).toContain(".env.example");
  });
});

test("the reason names the file without trailing sentence punctuation", () => {
  const { code, stderr } = runGuard("Bash", {
    command: "grep KEY .env.local; echo done",
  });
  expect(code).toBe(2);
  expect(stderr).toContain(": .env.local is a secrets file");
  const sentence = runGuard("Bash", { command: "cat .env.local." });
  expect(sentence.stderr).toContain(": .env.local is a secrets file");
});

describe("blocks editing AGENTS.md, package-lock.json and node_modules/", () => {
  test.each([
    ["Edit", { file_path: inProject("AGENTS.md") }],
    ["Write", { file_path: inProject("package-lock.json") }],
    ["Edit", { file_path: inProject("node_modules/next/dist/index.js") }],
    ["Bash", { command: "echo '# notes' >> AGENTS.md" }],
    ["Bash", { command: "sed -i '' 's/a/b/' package-lock.json" }],
    ["Bash", { command: "rm -r node_modules/vitest" }],
    // Absolute and variable paths are resolved against the project.
    ["Bash", { command: `echo x >> ${inProject("AGENTS.md")}` }],
    [
      "Bash",
      { command: `sed -i '' s/a/b/ "$CLAUDE_PROJECT_DIR/package-lock.json"` },
    ],
    ["Bash", { command: `GIT_PAGER=cat rm ${inProject("AGENTS.md")}` }],
    // cp writes its destination; rm of the whole folder stays blocked.
    ["Bash", { command: "cp /tmp/lock.json package-lock.json" }],
    ["Bash", { command: "rm -rf node_modules" }],
  ])("%s %o", (tool, input) => {
    const { code, stderr } = runGuard(tool, input);
    expect(code).toBe(2);
    expect(stderr).toContain("must not be edited by hand");
  });

  test("a ../ path is resolved against the session's cwd", () => {
    const { code, stderr } = runGuard(
      "Bash",
      { command: "echo x > ../AGENTS.md" },
      inProject("src"),
    );
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

describe("fails closed", () => {
  test("an unexpected error inside the guard blocks the call", () => {
    // [z-a] is an invalid character range, so building the glob throws.
    const { code, stderr } = runGuard("Bash", { command: "cat .e[z-a]*" });
    expect(code).toBe(2);
    expect(stderr).toContain("the guard itself failed");
  });

  test("unparseable stdin is let through", () => {
    const result = spawnSync("node", [script], {
      input: "not json",
      encoding: "utf8",
    });
    expect(result.status).toBe(0);
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
    ["Grep", { pattern: "x", path: inProject("src"), glob: "*.ts" }],
    // cp, ln and install only read their sources.
    ["Bash", { command: "cp package-lock.json /tmp/lock-backup.json" }],
    ["Bash", { command: "ln -s AGENTS.md /tmp/agents-link.md" }],
  ])("%s %o", (tool, input) => {
    expect(runGuard(tool, input)).toEqual({ code: 0, stderr: "" });
  });
});

describe("second review: line continuations", () => {
  test("a force push split with a trailing backslash is blocked", () => {
    const { code, stderr } = runGuard("Bash", {
      command: "git push \\\n  --force origin x",
    });
    expect(code).toBe(2);
    expect(stderr).toContain("force pushes are not allowed");
  });

  test("a push to main split with a trailing backslash is blocked", () => {
    const { code, stderr } = runGuard("Bash", {
      command: "git push origin \\\n  main",
    });
    expect(code).toBe(2);
    expect(stderr).toContain("pushing to main is not allowed");
  });
});

describe("second review: brace expansion", () => {
  test.each([
    ["Bash", { command: "cat .en{v,}" }],
    ["Bash", { command: "cat {.env,README.md}" }],
    ["Grep", { pattern: "KEY", path: inProject("."), glob: "{.env,x}" }],
  ])("%s %o is blocked", (tool, input) => {
    const { code, stderr } = runGuard(tool, input);
    expect(code).toBe(2);
    expect(stderr).toContain("secrets file (.env*)");
  });

  test.each([
    ["Bash", { command: "ls src/{lib,app}" }],
    ["Bash", { command: "git log --format=x | awk '{print $1}'" }],
    ["Bash", { command: `node -e 'console.log({a:1})'` }],
    ["Grep", { pattern: "x", path: inProject("src"), glob: "*.{ts,tsx}" }],
  ])("%s %o is allowed", (tool, input) => {
    expect(runGuard(tool, input)).toEqual({ code: 0, stderr: "" });
  });
});

describe("second review: wrapper commands", () => {
  test.each([
    "time git push --force origin x",
    "env git push -f origin x",
    "nohup git push --force origin x",
    "command git push --force origin x",
    "env -u PAGER GIT_TRACE=1 git push --force origin x",
  ])("force push behind a wrapper: %s", (command) => {
    const { code, stderr } = runGuard("Bash", { command });
    expect(code).toBe(2);
    expect(stderr).toContain("force pushes are not allowed");
  });

  test.each([
    "{ git push origin main; }",
    "echo origin | xargs git push --dry-run origin main",
  ])("push to main behind a wrapper: %s", (command) => {
    const { code, stderr } = runGuard("Bash", { command });
    expect(code).toBe(2);
    expect(stderr).toContain("pushing to main is not allowed");
  });

  test("a protected-file write behind a wrapper is blocked", () => {
    const { code, stderr } = runGuard("Bash", { command: "env rm AGENTS.md" });
    expect(code).toBe(2);
    expect(stderr).toContain("must not be edited by hand");
  });

  test("time npm test is allowed", () => {
    expect(runGuard("Bash", { command: "time npm test" })).toEqual({
      code: 0,
      stderr: "",
    });
  });
});

describe("second review: refspecs and push options", () => {
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
    "git push --branches",
    "git push origin :",
    "git push origin 'refs/heads/*:refs/heads/*'",
  ])("pushes every branch, main included: %s", (command) => {
    const { code, stderr } = runGuard("Bash", { command }, featureRepo);
    expect(code).toBe(2);
    expect(stderr).toContain("pushing to main is not allowed");
  });

  test.each([
    "git push -o ci.skip origin",
    "git push --push-option ci.skip origin",
    "git push --repo origin",
    "git push --receive-pack git-receive-pack origin",
  ])("an option value is not a refspec while on main: %s", (command) => {
    const { code, stderr } = runGuard("Bash", { command }, mainRepo);
    expect(code).toBe(2);
    expect(stderr).toContain("pushing to main is not allowed");
  });

  test("push options on a feature branch are allowed", () => {
    expect(
      runGuard(
        "Bash",
        { command: "git push -o ci.skip origin chore/24-hooks" },
        featureRepo,
      ),
    ).toEqual({ code: 0, stderr: "" });
  });
});

describe("second review: case-insensitive file names (macOS)", () => {
  test.each([
    ["Write", { file_path: inProject("agents.md") }],
    ["Edit", { file_path: inProject("Package-Lock.json") }],
    ["Edit", { file_path: inProject("Node_Modules/next/dist/index.js") }],
    ["Bash", { command: "rm Agents.MD" }],
  ])("%s %o is blocked", (tool, input) => {
    const { code, stderr } = runGuard(tool, input);
    expect(code).toBe(2);
    expect(stderr).toContain("must not be edited by hand");
  });
});

describe("second review: more shell writes", () => {
  test.each([
    "echo x >| AGENTS.md",
    "sed --in-place s/a/b/ AGENTS.md",
    "sed -i.bak s/a/b/ package-lock.json",
    "cp -t node_modules/next /tmp/patch.js",
    "cp --target-directory=node_modules/next /tmp/patch.js",
    "install -t node_modules/next /tmp/patch.js",
  ])("%s is blocked", (command) => {
    const { code, stderr } = runGuard("Bash", { command });
    expect(code).toBe(2);
    expect(stderr).toContain("must not be edited by hand");
  });

  test.each([
    "sed -i 's/node_modules/vendor/' .gitignore",
    "sed -i '' -e 's/node_modules/vendor/' .gitignore",
    "perl -pi -e 's/node_modules/vendor/' .gitignore",
    "perl -i -pe 's/AGENTS.md/agents/' README.md",
  ])(
    "an in-place script that only mentions a protected name: %s",
    (command) => {
      expect(runGuard("Bash", { command })).toEqual({ code: 0, stderr: "" });
    },
  );

  test.each([
    "sed -i '' -e s/a/b/ package-lock.json",
    "perl -pi -e 's/a/b/' AGENTS.md",
  ])("an in-place edit of a protected file: %s", (command) => {
    const { code, stderr } = runGuard("Bash", { command });
    expect(code).toBe(2);
    expect(stderr).toContain("must not be edited by hand");
  });

  test("cp -t with a normal destination is allowed", () => {
    expect(
      runGuard("Bash", { command: "cp -t /tmp AGENTS.md package-lock.json" }),
    ).toEqual({ code: 0, stderr: "" });
  });
});
