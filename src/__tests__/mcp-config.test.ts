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

// Common credential formats: OpenAI/Anthropic, GitHub, Supabase access and
// secret keys, AWS access key IDs, JWTs, bearer headers, and words that
// usually name a secret.
const SECRET_PATTERN =
  /sk-|ghp_|github_pat_|sbp_|sb_secret_|AKIA[0-9A-Z]{16}|eyJ[A-Za-z0-9_-]{10,}|bearer\s|service[_-]?role|password|secret|token|api[_-]?key/i;

function allStrings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(allStrings);
  if (value !== null && typeof value === "object") {
    return Object.entries(value).flatMap(([key, inner]) => [
      key,
      ...allStrings(inner),
    ]);
  }
  return [];
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
    for (const text of allStrings(config)) {
      expect(text).not.toMatch(SECRET_PATTERN);
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
      "SUPABASE_SERVICE_ROLE_KEY",
      "service_role",
      "--api-key=abc",
      "password=hunter2",
      "access_token",
    ];

    for (const sample of samples) {
      expect(sample).toMatch(SECRET_PATTERN);
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
