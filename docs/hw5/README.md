# HW5 Part 2: MCP server integration (issue #17)

OnTrack (CS6983 Project 3) · Barbara (Bobbi) Louyakis, Ziye Huang

We connected the [Playwright MCP server](https://github.com/microsoft/playwright-mcp)
to Claude Code at project scope, then used it to drive the running app.

## Configuration

- [`/.mcp.json`](../../.mcp.json): the shared server config, created with
  `claude mcp add --scope project playwright -- npx -y @playwright/mcp@0.0.86 --isolated`.
  It holds no secrets: no env values, headers or keys.
- [`/src/__tests__/mcp-config.test.ts`](../../src/__tests__/mcp-config.test.ts):
  fails `npm test` if the version is unpinned, `--isolated` is dropped, or a
  secret-looking value is added. Written first and seen failing (ENOENT), then
  made to pass by adding `.mcp.json`.
- [`playwright-mcp-setup.md`](playwright-mcp-setup.md): setup someone else can
  follow, and what the server enables.

## The task done through MCP

Goal: as the seeded contributor, add a Meeting entry through the entry form
and confirm it shows up in the project log. Also check that a future-dated
entry is rejected. Every browser action went through `mcp__playwright__*`
tools against `next dev` on port 3017 with the local Supabase stack.

Steps (all in [`playwright-mcp-session.txt`](playwright-mcp-session.txt)):

1. `browser_navigate` to `/`. The app redirected to `/sign-in`.
2. `browser_snapshot` to read the form, then `browser_fill_form` and
   `browser_click` to sign in as `demo.contributor@ontrack.local`.
3. `browser_click` on "Demo Project" and `browser_snapshot` of the project
   page: the entry form and the three seeded entries.
4. `browser_select_option` "Meeting". The snapshot showed the Attendees,
   Decisions made and Action items fields appear.
5. Future-date check: filled the form with **2026-12-31** and submitted. The
   app answered "Entry added.", so the entry was **accepted**
   ([`screenshots/03-future-date-accepted.png`](screenshots/03-future-date-accepted.png)).
6. Valid entry: Meeting on 2026-11-25, 1.5 h, with details, a link to issue
   #17, attendees, decisions and action items. Submitted: "Entry added."
7. `browser_snapshot` of the project log: the new entry is listed with every
   field, in date order, newest first (below the Dec 31 entry)
   ([`screenshots/02-project-log-with-new-entry.png`](screenshots/02-project-log-with-new-entry.png)).
8. `browser_console_messages`: no errors after the env file was in place.
   `browser_close`.

## What it found

The PRD rule "Date is required and cannot be in the future" is not enforced
yet: the server saved an entry dated 2026-12-31. This is expected for now:
`src/lib/entry-required-fields.ts` checks only that fields are present, and the
remaining validation rules are open issue
[#32](https://github.com/blouyakis/on-track/issues/32). It is out of scope for
#17, so nothing was changed. When #32 lands, the same MCP run should show the
error message instead.

Two entries from this run (2026-12-31 and 2026-11-25) stay in the local
database until the next `npx supabase db reset`.

## Files

- [`playwright-mcp-session.txt`](playwright-mcp-session.txt): the session log.
- [`screenshots/02-project-log-with-new-entry.png`](screenshots/02-project-log-with-new-entry.png):
  the project log after the valid entry.
- [`screenshots/03-future-date-accepted.png`](screenshots/03-future-date-accepted.png):
  the page right after the future-dated entry was accepted.

There is no `01-…` screenshot. The call to capture the filled-in form used a
stale element reference and failed ("Ref f2e72 not found"; see the log), and
the form had already been submitted by then. The file names are kept as the
session recorded them.
