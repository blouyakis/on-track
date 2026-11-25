import { beforeEach, describe, expect, test, vi } from "vitest";
import { createEntry } from "@/app/actions";
import { initialEntryFormState } from "@/app/entry-form-state";
import { createClient } from "@/utils/supabase/server";

// The database layer is mocked at the boundary: the action only ever sees
// this fake Supabase client.
vi.mock("@/utils/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("next/cache", () => ({ refresh: vi.fn() }));

const USER_ID = "user-from-session";
const PROJECT_ID = "project-from-membership";

type FakeOptions = {
  user?: { id: string } | null;
  membership?: { project_id: string; role: string } | null;
  insertError?: { message: string } | null;
};

function fakeSupabase({
  user = { id: USER_ID },
  membership = { project_id: PROJECT_ID, role: "contributor" },
  insertError = null,
}: FakeOptions = {}) {
  const insert = vi.fn().mockResolvedValue({ error: insertError });
  const membershipQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: membership, error: null }),
  };
  const client = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
    },
    from: vi.fn((table: string) =>
      table === "memberships" ? membershipQuery : { insert },
    ),
  };
  vi.mocked(createClient).mockResolvedValue(
    client as unknown as Awaited<ReturnType<typeof createClient>>,
  );
  return { insert, membershipQuery };
}

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [name, value] of Object.entries(fields)) data.set(name, value);
  return data;
}

const workEntry = {
  date: "2026-11-14",
  hours: "1.5",
  type: "work",
  details: "Wrote the migration.",
  link: "",
};

// A server action can be called by anyone who can reach the app, whether or
// not a button for it is on the page, so the demo sign-in has to be gone from
// the module and not only from the screen.
describe("the demo sign-in", () => {
  test("is no longer a server action", async () => {
    const actions = await import("@/app/actions");

    expect(Object.keys(actions)).not.toContain("signInAsDemoContributor");
    expect(Object.keys(actions).join(" ")).not.toMatch(/demo/i);
  });

  test("has no state left in the form-state module", async () => {
    const formState = await import("@/app/entry-form-state");

    expect(Object.keys(formState).join(" ")).not.toMatch(/demo/i);
  });
});

describe("createEntry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  test("returns an error and saves nothing when nobody is signed in", async () => {
    const { insert } = fakeSupabase({ user: null });

    const state = await createEntry(initialEntryFormState, form(workEntry));

    expect(state.status).toBe("error");
    expect(insert).not.toHaveBeenCalled();
  });

  test("returns an error and saves nothing when the user has no membership", async () => {
    const { insert } = fakeSupabase({ membership: null });

    const state = await createEntry(initialEntryFormState, form(workEntry));

    expect(state.status).toBe("error");
    expect(insert).not.toHaveBeenCalled();
  });

  test("returns an error and saves nothing when the user is an overseer", async () => {
    const { insert } = fakeSupabase({
      membership: { project_id: PROJECT_ID, role: "overseer" },
    });

    const state = await createEntry(initialEntryFormState, form(workEntry));

    expect(state.status).toBe("error");
    expect(insert).not.toHaveBeenCalled();
  });

  test("returns a field error and saves nothing when details are blank", async () => {
    const { insert } = fakeSupabase();

    const state = await createEntry(
      initialEntryFormState,
      form({ ...workEntry, details: "   " }),
    );

    expect(state.status).toBe("error");
    expect(state.fieldErrors.details).toBe("Details are required.");
    expect(insert).not.toHaveBeenCalled();
  });

  test("returns a field error and saves nothing for a type that is not listed", async () => {
    const { insert } = fakeSupabase();

    const state = await createEntry(
      initialEntryFormState,
      form({ ...workEntry, type: "task" }),
    );

    expect(state.status).toBe("error");
    expect(state.fieldErrors.type).toBeTruthy();
    expect(insert).not.toHaveBeenCalled();
  });

  test("saves a meeting entry with its attendees, decisions and action items", async () => {
    const { insert } = fakeSupabase();

    const state = await createEntry(
      initialEntryFormState,
      form({
        date: "2026-11-14",
        hours: "1",
        type: "meeting",
        details: "Weekly sync.",
        link: "https://example.com/notes",
        attendees: "Bobbi, Ziye",
        decisions: "Use Supabase Auth.",
        action_items: "Bobbi: write the seed.",
      }),
    );

    expect(state.status).toBe("success");
    expect(insert).toHaveBeenCalledTimes(1);
    expect(insert).toHaveBeenCalledWith({
      project_id: PROJECT_ID,
      author_id: USER_ID,
      entry_date: "2026-11-14",
      hours: 1,
      type: "meeting",
      details: "Weekly sync.",
      link: "https://example.com/notes",
      attendees: "Bobbi, Ziye",
      decisions: "Use Supabase Auth.",
      action_items: "Bobbi: write the seed.",
    });
  });

  test("drops the meeting fields and an empty link for a non-meeting entry", async () => {
    const { insert } = fakeSupabase();

    await createEntry(
      initialEntryFormState,
      form({
        ...workEntry,
        attendees: "Bobbi, Ziye",
        decisions: "Should not be saved.",
        action_items: "Should not be saved.",
      }),
    );

    expect(insert).toHaveBeenCalledWith({
      project_id: PROJECT_ID,
      author_id: USER_ID,
      entry_date: "2026-11-14",
      hours: 1.5,
      type: "work",
      details: "Wrote the migration.",
      link: null,
      attendees: null,
      decisions: null,
      action_items: null,
    });
  });

  test("takes the project and author from the server, not from the form", async () => {
    const { insert, membershipQuery } = fakeSupabase();

    await createEntry(
      initialEntryFormState,
      form({
        ...workEntry,
        project_id: "someone-elses-project",
        author_id: "someone-else",
      }),
    );

    expect(membershipQuery.eq).toHaveBeenCalledWith("user_id", USER_ID);
    const saved = insert.mock.calls[0][0];
    expect(saved.project_id).toBe(PROJECT_ID);
    expect(saved.author_id).toBe(USER_ID);
  });

  test("returns a generic message when the database rejects the entry", async () => {
    fakeSupabase({
      insertError: {
        message: 'violates check constraint "entries_hours_check"',
      },
    });

    const state = await createEntry(initialEntryFormState, form(workEntry));

    expect(state.status).toBe("error");
    expect(state.message).toBeTruthy();
    expect(state.message).not.toContain("constraint");
  });
});
