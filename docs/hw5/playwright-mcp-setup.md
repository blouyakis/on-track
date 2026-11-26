# Playwright MCP server: setup

OnTrack shares one MCP server with everyone who opens the repo in Claude Code:
[Playwright MCP](https://github.com/microsoft/playwright-mcp)
(`@playwright/mcp`). It is configured at project scope in
[`/.mcp.json`](../../.mcp.json), so a teammate gets it by pulling the repo and
approving it once. No per-person setup command is needed.

## What it enables

The server gives Claude Code a real browser it can drive, through tools named
`mcp__playwright__browser_*`. Claude can:

- **Navigate** to a URL, go back, and manage tabs (`browser_navigate`,
  `browser_navigate_back`, `browser_tabs`).
- **Read the page** as an accessibility snapshot: the roles, names and values
  of every element, with a reference for each one (`browser_snapshot`). This is
  how Claude finds the "Hours" field or the "Save entry" button without
  guessing at CSS selectors.
- **Act on the page**: click, type, fill a whole form at once, pick an option
  in a `<select>`, press keys, hover, drag, and answer dialogs
  (`browser_click`, `browser_type`, `browser_fill_form`,
  `browser_select_option`, `browser_press_key`, `browser_hover`,
  `browser_drag`, `browser_handle_dialog`).
- **Wait** for text to appear or disappear (`browser_wait_for`).
- **Inspect** console messages and network requests (`browser_console_messages`,
  `browser_network_requests`), which shows server errors and failed requests.
- **Take screenshots** of the page or one element (`browser_take_screenshot`).

For OnTrack this means Claude can check a change in the running app the way a
user would: sign in, open a project, submit the entry form, and confirm the
entry shows up in the project log, or that a bad entry is rejected with the
right message. It complements the unit and component tests; it does not
replace the Playwright end-to-end suite (issue #25), which runs in CI without
Claude.

## How it is configured

`.mcp.json` was created with this command, run from the repo root:

```bash
claude mcp add --scope project playwright -- npx -y @playwright/mcp@0.0.86 --isolated
```

```json
{
  "mcpServers": {
    "playwright": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@playwright/mcp@0.0.86", "--isolated"],
      "env": {}
    }
  }
}
```

- `--scope project` writes the server to `.mcp.json` in the repo (committed)
  instead of your personal `~/.claude.json`.
- `stdio`: Claude Code starts the server as a local process with `npx`. Nothing
  listens on a network port, and no account or API key is involved.
- `@playwright/mcp@0.0.86` is pinned, so everyone runs the same version. To
  upgrade, change the version in `.mcp.json` (and the check below still
  passes as long as it is an exact `x.y.z`).
- `-y` lets `npx` download the package on first use without a prompt. It is
  not added to `package.json`.
- `--isolated` keeps the browser profile in memory. Cookies and sign-ins are
  thrown away when the browser closes, and nothing is written to a profile
  folder on disk.

**No secrets.** The file has no environment variables, headers or keys, and
[`src/__tests__/mcp-config.test.ts`](../../src/__tests__/mcp-config.test.ts)
fails `npm test` (and CI) if an env value or header is added, if a value
matches a common secret format (for example `sk-`, `ghp_`, `sbp_`,
`sb_secret_`, AWS `AKIA…`, a JWT, `Bearer …`, or `--api-key=…`), if a key
is named like a secret (`token`, `password`, `service_role`), or if the
version is unpinned. Harmless arguments such as `--no-token-refresh` pass. It
cannot catch every possible secret, so still review changes to `.mcp.json`.

The server writes page snapshots, console logs and screenshots to
`.playwright-mcp/` in the repo root. That folder is in `.gitignore`; copy
anything you want to keep into `docs/` instead.

## Reproduce it

### 1. Prerequisites

- Node 26 and npm (see `.nvmrc`). `npx` comes with npm.
- Google Chrome. The server uses the installed Chrome by default. Without it,
  run `npx playwright install chrome` once. Or use Chromium through a
  local-scope server, which overrides the project one for you only and
  leaves the shared `.mcp.json` untouched:
  `claude mcp add --scope local playwright -- npx -y @playwright/mcp@0.0.86 --isolated --browser chromium`.
- Claude Code.
- For driving OnTrack itself: the app running locally, as in the
  [README](../../README.md#getting-started): Docker Desktop,
  `npx supabase start`, `npx supabase db reset`, and the local env file with
  the two `NEXT_PUBLIC_SUPABASE_*` values in the repo root.

### 2. Load and approve the server

1. Pull the branch that has `.mcp.json`.
2. Start Claude Code from the repo root (`claude`). A server in `.mcp.json`
   loads only when Claude Code starts, so restart any session that was already
   open (`claude --continue` resumes it).
3. Claude Code asks whether to use the project's MCP server `playwright`.
   Choose to approve it. (If you dismissed the prompt, run
   `claude mcp reset-project-choices` and restart.)
4. Run `/mcp` inside Claude Code. `playwright` should show as connected, with
   its tools listed. From a shell, `claude mcp list` shows the same thing.

The first start downloads `@playwright/mcp` with `npx`, which takes a few
seconds.

### 3. Use it

Start the app (`npm run dev`, or `npx next dev -p 3017` if port 3000 is
taken), then ask Claude in plain words, for example:

> Using the Playwright MCP tools, open http://localhost:3017, sign in as the
> seeded contributor from `supabase/seed.sql`, open Demo Project, log a
> 1.5-hour Meeting entry for today with attendees, decisions and action
> items, and check that it is at the top of the project log.

Claude Code asks for permission the first time it calls each browser tool.
The tools are deliberately not in the allow list in `.claude/settings.json`,
so a browser action is never taken silently. A headed Chrome window opens, so
you can watch what it does.

[`README.md`](README.md) in this folder links the session where we did exactly
this, with screenshots.

### 4. Turn it off

- For yourself only: run `/mcp`, select `playwright`, and disable it, or
  decline it at the approval prompt.
- For everyone: remove it with `claude mcp remove --scope project playwright`
  and commit the change to `.mcp.json`.

## Limits

- It drives a browser on your machine, so it only reaches what your machine
  can reach. Point it at `localhost` or a Vercel preview, not at sites you do
  not trust: page text goes back to Claude as tool output.
- Every sign-in starts from scratch because of `--isolated`. Use the seeded
  local account; never type a real password into a session that is being
  recorded.
- It is a tool for Claude during development. Repeatable browser tests belong
  in the Playwright test suite (#25).
