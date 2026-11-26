import { expect, test } from "@playwright/test";

// The contributor that supabase/seed.sql creates, a member of "Demo Project".
// These are local-only demo credentials: they exist only in a database built
// from that seed file and protect nothing real.
const CONTRIBUTOR = {
  email: "demo.contributor@ontrack.local",
  password: "ontrack-local-demo",
};
const PROJECT_NAME = "Demo Project";

test("a contributor signs in, adds an entry and sees it in the project log", async ({
  page,
}) => {
  // Unique per run, so a rerun against the same local database finds its own
  // entry and not one an earlier run left behind.
  const details = `E2E entry ${Date.now()}`;

  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(CONTRIBUTOR.email);
  await page.getByLabel("Password").fill(CONTRIBUTOR.password);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL("/");
  await page.getByRole("link", { name: PROJECT_NAME }).click();
  await expect(
    page.getByRole("heading", { name: PROJECT_NAME, level: 2 }),
  ).toBeVisible();

  const form = page.getByRole("region", { name: "Add an entry" });
  // A fixed past date, so the PRD rule against future dates never rejects it.
  await form.getByLabel("Date", { exact: true }).fill("2026-11-20");
  await form.getByLabel("Hours", { exact: true }).fill("1.5");
  // The select's accessible name includes its option labels (one of them,
  // "Async update", contains "date"), so it is found by role, not label.
  await form.getByRole("combobox").selectOption({ label: "Work" });
  await form.getByLabel("Details", { exact: true }).fill(details);
  await form.getByRole("button", { name: "Add entry" }).click();

  await expect(form.getByText("Entry added.")).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Project log" }).getByText(details),
  ).toBeVisible();
});
