import { defineConfig, devices } from "@playwright/test";

// End-to-end tests run against a production build, never `next dev`: the
// build is what users get, and some behavior (for example the no-JavaScript
// error path in the README's known issues) differs in development.
//
// Port 3100, not 3000, so a `next dev` server left running on 3000 is never
// tested by mistake. Locally an `npm start -- -p 3100` you started yourself is
// reused; in CI the server is always built fresh.
const PORT = 3100;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run build && npm start -- -p ${PORT}`,
    url: BASE_URL,
    // The production build runs first, so allow it time.
    timeout: 180_000,
    reuseExistingServer: !isCI,
  },
});
