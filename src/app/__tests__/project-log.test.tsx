import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { redirect } from "next/navigation";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { signOut } from "@/app/auth-actions";
import { ProjectLog } from "@/app/project-log";
import { createClient } from "@/utils/supabase/server";

// The database layer is mocked at the boundary: the component only ever sees
// this fake Supabase client.
vi.mock("@/utils/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("next/server", () => ({
  connection: vi.fn().mockResolvedValue(undefined),
}));
// The real redirect() throws to stop rendering, so the fake does too.
vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));
vi.mock("@/app/actions", () => ({ createEntry: vi.fn() }));
vi.mock("@/app/auth-actions", () => ({ signOut: vi.fn() }));

const USER = { id: "user-id", email: "bobbi@example.com" };
const MEMBERSHIP = { project_id: "project-id", role: "contributor" };
const ENTRY = {
  id: "entry-id",
  author_id: USER.id,
  entry_date: "2026-11-14",
  hours: 1.5,
  type: "work",
  details: "Wrote the migration.",
  link: null,
  attendees: null,
  decisions: null,
  action_items: null,
  created_at: "2026-11-14T12:00:00Z",
};

type FakeOptions = {
  user?: { id: string; email?: string } | null;
  membership?: { project_id: string; role: string } | null;
};

// Every query method returns the same chain, and the last call in each of
// the component's queries, overrideTypes, resolves with the rows.
function query(result: unknown) {
  const chain: Record<string, unknown> = {};
  for (const method of ["select", "eq", "limit", "order", "maybeSingle"]) {
    chain[method] = vi.fn(() => chain);
  }
  chain.overrideTypes = vi.fn(() => Promise.resolve(result));
  return chain;
}

function fakeSupabase({ user = USER, membership = MEMBERSHIP }: FakeOptions) {
  const from = vi.fn((table: string) => {
    if (table === "memberships") return query({ data: membership });
    if (table === "projects") return query({ data: { name: "Capstone" } });
    return query({ data: [ENTRY], error: null });
  });
  const client = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
    },
    from,
  };
  vi.mocked(createClient).mockResolvedValue(
    client as unknown as Awaited<ReturnType<typeof createClient>>,
  );
  return { from };
}

beforeEach(() => {
  vi.clearAllMocks();
});
afterEach(cleanup);

describe("ProjectLog, signed out", () => {
  test("sends the visitor to the sign-in page", async () => {
    fakeSupabase({ user: null });

    await expect(ProjectLog()).rejects.toThrow("NEXT_REDIRECT");

    expect(redirect).toHaveBeenCalledWith("/sign-in");
  });

  test("reads nothing from any table", async () => {
    const { from } = fakeSupabase({ user: null });

    await expect(ProjectLog()).rejects.toThrow("NEXT_REDIRECT");

    expect(from).not.toHaveBeenCalled();
  });
});

describe("ProjectLog, signed in", () => {
  test("shows the project, its entries and who is signed in", async () => {
    fakeSupabase({});

    render(await ProjectLog());

    expect(redirect).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "Capstone" })).toBeTruthy();
    expect(screen.getByText("Wrote the migration.")).toBeTruthy();
    expect(screen.getByText("bobbi@example.com")).toBeTruthy();
  });

  test("has a Sign out button that runs the signOut action", async () => {
    fakeSupabase({});
    render(await ProjectLog());

    const button = screen.getByRole("button", { name: "Sign out" });
    const form = button.closest("form");
    if (!form) throw new Error("The button is not inside a form.");
    fireEvent.submit(form);

    await waitFor(() => expect(signOut).toHaveBeenCalledTimes(1));
  });

  // A new account has no project until the projects feature lets it create
  // or join one. It must still be able to sign out.
  test("lets a user with no project sign out", async () => {
    fakeSupabase({ membership: null });

    render(await ProjectLog());

    expect(
      screen.getByText("You are not a member of a project yet."),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeTruthy();
  });

  test("offers no demo sign-in", async () => {
    fakeSupabase({});

    render(await ProjectLog());

    expect(screen.queryByText(/demo/i)).toBeNull();
  });
});
