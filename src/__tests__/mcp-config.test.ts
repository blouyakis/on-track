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

    expect(server.args).toContain("--isolated");
  });

  it("holds no environment variables, headers, or secret-looking values", () => {
    const config = readMcpConfig();

    for (const server of Object.values(config.mcpServers)) {
      expect(server.env ?? {}).toEqual({});
      expect(server.headers).toBeUndefined();
    }
    for (const text of allStrings(config)) {
      expect(text).not.toMatch(
        /sk-|ghp_|github_pat_|eyJ[A-Za-z0-9_-]{10,}|password|secret|token|api[_-]?key/i,
      );
    }
  });
});
