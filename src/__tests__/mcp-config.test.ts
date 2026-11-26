import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// `.mcp.json` is committed and shared with every teammate, so it must
// configure the Playwright MCP server reproducibly and must never hold a
// secret.

type McpServer = {
  type?: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  headers?: Record<string, string>;
};

function readMcpConfig(): { mcpServers: Record<string, McpServer> } {
  const raw = readFileSync(join(process.cwd(), ".mcp.json"), "utf8");
  return JSON.parse(raw) as { mcpServers: Record<string, McpServer> };
}

// Checked against every string in the file (keys and values). Each prefix
// must start a word and be followed by a key-like body, so `@scope/task-runner`
// does not count as an `sk-` key. Covers OpenAI/Anthropic, GitHub, Supabase
// access and secret keys, AWS access key IDs, JWTs, bearer headers, and a
// secret word assigned a value (`--api-key=…`, `password=…`).
const SECRET_PATTERN = new RegExp(
  [
    String.raw`\bsk-[A-Za-z0-9_-]{6,}`,
    String.raw`\bghp_[A-Za-z0-9]{6,}`,
    String.raw`\bgithub_pat_[A-Za-z0-9_]{6,}`,
    String.raw`\bsbp_[A-Za-z0-9]{6,}`,
    String.raw`\bsb_secret_[A-Za-z0-9_-]{6,}`,
    String.raw`\bAKIA[0-9A-Z]{16}\b`,
    String.raw`\beyJ[A-Za-z0-9_-]{10,}`,
    String.raw`\bbearer\s+\S+`,
    String.raw`(?:^|[^A-Za-z0-9])(?:api[_-]?key|password|secret|token|service[_-]?role(?:[_-]?key)?)=\S`,
  ].join("|"),
  "i",
);

// Checked against object keys and env names only. These words are normal in
// argument values (`--no-token-refresh`), but a key named after one is meant
// to hold a secret.
const SECRET_NAME_PATTERN =
  /password|secret|token|api[_-]?key|service[_-]?role/i;

function collect(value: unknown): { keys: string[]; values: string[] } {
  if (typeof value === "string") return { keys: [], values: [value] };
  const entries: [string | null, unknown][] = Array.isArray(value)
    ? value.map((inner) => [null, inner])
    : value !== null && typeof value === "object"
      ? Object.entries(value)
      : [];
  const keys: string[] = [];
  const values: string[] = [];
  for (const [key, inner] of entries) {
    if (key !== null) keys.push(key);
    const nested = collect(inner);
    keys.push(...nested.keys);
    values.push(...nested.values);
  }
  return { keys, values };
}

describe(".mcp.json", () => {
  it("runs the Playwright MCP server with npx at a pinned version", () => {
    const server = readMcpConfig().mcpServers.playwright;

    expect(server).toBeDefined();
    expect(server.command).toBe("npx");
    expect(server.args).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^@playwright\/mcp@\d+\.\d+\.\d+$/),
      ]),
    );
  });

  it("starts the browser with an isolated, in-memory profile", () => {
    const server = readMcpConfig().mcpServers.playwright;

    expect(server).toBeDefined();
    expect(server.args).toContain("--isolated");
  });

  it("holds no environment variables, headers, or secret-looking values", () => {
    const config = readMcpConfig();

    for (const server of Object.values(config.mcpServers)) {
      expect(server.env ?? {}).toEqual({});
      expect(server.headers).toBeUndefined();
    }
    const { keys, values } = collect(config);
    for (const text of [...keys, ...values]) {
      expect(text).not.toMatch(SECRET_PATTERN);
    }
    for (const key of keys) {
      expect(key).not.toMatch(SECRET_NAME_PATTERN);
    }
  });

  it("recognises common secret formats", () => {
    const samples = [
      "sk-ant-api03-abc",
      "ghp_abc123",
      "github_pat_abc123",
      "sbp_0123456789abcdef",
      "sb_secret_abc123",
      "AKIAABCDEFGHIJKLMNOP",
      "eyJhbGciOiJIUzI1NiJ9",
      "Authorization: Bearer abc.def",
      "--api-key=abc",
      "password=hunter2",
    ];
    // Bare secret words count only as key or env names.
    const names = ["SUPABASE_SERVICE_ROLE_KEY", "service_role", "access_token"];

    for (const sample of samples) {
      expect(sample).toMatch(SECRET_PATTERN);
    }
    for (const name of names) {
      expect(name).toMatch(SECRET_NAME_PATTERN);
    }
    for (const safe of ["npx", "-y", "@playwright/mcp@0.0.86", "--isolated"]) {
      expect(safe).not.toMatch(SECRET_PATTERN);
    }
  });

  it("does not flag harmless arguments that merely contain a secret word", () => {
    const safeArgs = [
      "@scope/task-runner",
      "--no-token-refresh",
      "--secret-scanning",
      "--password-store=basic",
    ];

    for (const safe of safeArgs) {
      expect(safe).not.toMatch(SECRET_PATTERN);
    }
  });
});
