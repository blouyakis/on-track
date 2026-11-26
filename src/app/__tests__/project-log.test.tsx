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

const INVITE_CODE = "K7QXM-2RDTP";

type FakeOptions = {
  user?: { id: string; email?: string } | null;
  membership?: { project_id: string; role: string } | null;
  membershipError?: { message: string } | null;
};

// The page passes the URL's params down without awaiting them.
function onProject(projectId = MEMBERSHIP.project_id) {
  return { params: Promise.resolve({ projectId }) };
}

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

function fakeSupabase({
  user = USER,
  membership = MEMBERSHIP,
  membershipError = null,
}: FakeOptions) {
  const memberships = query({
    data: membershipError ? null : membership,
    error: membershipError,
  });
  const from = vi.fn((table: string) => {
    if (table === "memberships") return memberships;
    if (table === "projects") return query({ data: { name: "Capstone" } });
    return query({ data: [ENTRY], error: null });
  });
  // The only database function the page calls is the one for the invite code.
  const rpc = vi.fn().mockResolvedValue({ data: INVITE_CODE, error: null });
  const client = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
    },
    from,
    rpc,
  };
  vi.mocked(createClient).mockResolvedValue(
    client as unknown as Awaited<ReturnType<typeof createClient>>,
  );
  return { from, rpc, memberships };
}

beforeEach(() => {
  vi.clearAllMocks();
});
afterEach(cleanup);

describe("ProjectLog, signed out", () => {
  test("sends the visitor to the sign-in page", async () => {
    fakeSupabase({ user: null });

    await expect(ProjectLog(onProject())).rejects.toThrow("NEXT_REDIRECT");

    expect(redirect).toHaveBeenCalledWith("/sign-in");
  });

  test("reads nothing from any table", async () => {
    const { from } = fakeSupabase({ user: null });

    await expect(ProjectLog(onProject())).rejects.toThrow("NEXT_REDIRECT");

    expect(from).not.toHaveBeenCalled();
  });
});

describe("ProjectLog, signed in", () => {
  test("shows the project, its entries and who is signed in", async () => {
    fakeSupabase({});

    render(await ProjectLog(onProject()));

    expect(redirect).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "Capstone" })).toBeTruthy();
    expect(screen.getByText("Wrote the migration.")).toBeTruthy();
    expect(screen.getByText("bobbi@example.com")).toBeTruthy();
  });

  test("has a Sign out button that runs the signOut action", async () => {
    fakeSupabase({});
    render(await ProjectLog(onProject()));

    const button = screen.getByRole("button", { name: "Sign out" });
    const form = button.closest("form");
    if (!form) throw new Error("The button is not inside a form.");
    fireEvent.submit(form);

    await waitFor(() => expect(signOut).toHaveBeenCalledTimes(1));
  });

  // "lets a user with no project sign out" moved to project-list.test.tsx:
  // a user with no project now lands on the list of projects, not here.

  test("offers no demo sign-in", async () => {
    fakeSupabase({});

    render(await ProjectLog(onProject()));

    expect(screen.queryByText(/demo/i)).toBeNull();
  });
});

// The page is for one project, named in the URL. The URL is only a request:
// the membership looked up on the server decides what is shown.
describe("ProjectLog, on one project's page", () => {
  test("looks up the signed-in user's membership in the project from the URL", async () => {
    const { memberships } = fakeSupabase({});

    render(await ProjectLog(onProject()));

    expect(memberships.eq).toHaveBeenCalledWith("user_id", USER.id);
    expect(memberships.eq).toHaveBeenCalledWith(
      "project_id",
      MEMBERSHIP.project_id,
    );
  });

  test("links back to the list of the user's projects", async () => {
    fakeSupabase({});

    render(await ProjectLog(onProject()));

    const link = screen.getByRole("link", { name: "Your projects" });
    expect(link.getAttribute("href")).toBe("/");
  });

  test("shows a contributor the entry form", async () => {
    fakeSupabase({});

    render(await ProjectLog(onProject()));

    expect(screen.getByRole("heading", { name: "Add an entry" })).toBeTruthy();
  });

  test("shows the overseer no entry form", async () => {
    fakeSupabase({
      membership: { project_id: MEMBERSHIP.project_id, role: "overseer" },
    });

    render(await ProjectLog(onProject()));

    expect(screen.queryByRole("heading", { name: "Add an entry" })).toBeNull();
    expect(screen.getByText("Wrote the migration.")).toBeTruthy();
  });
});

describe("ProjectLog, the invite code", () => {
  test("shows the overseer the project's invite code to share", async () => {
    const { rpc } = fakeSupabase({
      membership: { project_id: MEMBERSHIP.project_id, role: "overseer" },
    });

    render(await ProjectLog(onProject()));

    expect(screen.getByRole("heading", { name: "Invite code" })).toBeTruthy();
    expect(screen.getByText(INVITE_CODE)).toBeTruthy();
    expect(rpc).toHaveBeenCalledWith("project_invite_code", {
      p_project_id: MEMBERSHIP.project_id,
    });
  });

  test("shows a contributor no invite code, and does not ask for one", async () => {
    const { rpc } = fakeSupabase({});

    render(await ProjectLog(onProject()));

    expect(screen.queryByRole("heading", { name: "Invite code" })).toBeNull();
    expect(screen.queryByText(INVITE_CODE)).toBeNull();
    expect(rpc).not.toHaveBeenCalled();
  });

  // A role the app does not know is treated as no role at all.
  test("shows no invite code or entry form for a role that is not listed", async () => {
    const { rpc } = fakeSupabase({
      membership: { project_id: MEMBERSHIP.project_id, role: "admin" },
    });

    render(await ProjectLog(onProject()));

    expect(screen.queryByText(INVITE_CODE)).toBeNull();
    expect(screen.queryByRole("heading", { name: "Add an entry" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Capstone" })).toBeNull();
    expect(rpc).not.toHaveBeenCalled();
  });
});

// A user with no membership in a project gets no data from it, including its
// name. A project that does not exist looks exactly the same.
describe("ProjectLog, a project the user is not a member of", () => {
  const NOT_FOUND =
    "This project does not exist, or you are not a member of it.";

  test("says the project was not found and shows nothing from it", async () => {
    fakeSupabase({ membership: null });

    render(await ProjectLog(onProject("someone-elses-project")));

    expect(screen.getByText(NOT_FOUND)).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Capstone" })).toBeNull();
    expect(screen.queryByText("Wrote the migration.")).toBeNull();
    expect(screen.queryByText(INVITE_CODE)).toBeNull();
    expect(screen.queryByRole("heading", { name: "Add an entry" })).toBeNull();
  });

  test("reads nothing but the membership", async () => {
    const { from, rpc } = fakeSupabase({ membership: null });

    render(await ProjectLog(onProject("someone-elses-project")));

    expect(from).toHaveBeenCalledTimes(1);
    expect(from).toHaveBeenCalledWith("memberships");
    expect(rpc).not.toHaveBeenCalled();
  });

  // For example an id in the URL that is not a UUID.
  test("gives the same answer when the membership lookup fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { from } = fakeSupabase({
      membershipError: { message: "invalid input syntax for type uuid" },
    });

    render(await ProjectLog(onProject("not-a-uuid")));

    expect(screen.getByText(NOT_FOUND)).toBeTruthy();
    expect(screen.queryByText(/uuid/)).toBeNull();
    expect(from).toHaveBeenCalledTimes(1);
  });

  test("still lets the user go back to their projects or sign out", async () => {
    fakeSupabase({ membership: null });

    render(await ProjectLog(onProject("someone-elses-project")));

    expect(screen.getByRole("link", { name: "Your projects" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeTruthy();
  });
});
