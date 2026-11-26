import { cleanup, render, screen, within } from "@testing-library/react";
import { redirect } from "next/navigation";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { ProjectList } from "@/app/project-list";
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
vi.mock("@/app/auth-actions", () => ({ signOut: vi.fn() }));
vi.mock("@/app/project-actions", () => ({
  createProject: vi.fn(),
  joinProject: vi.fn(),
}));

const USER = { id: "user-id", email: "bobbi@example.com" };

// What the memberships query returns: one row per project the user is in,
// with that project's name.
const MEMBERSHIPS = [
  {
    project_id: "11111111-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    role: "overseer",
    projects: { name: "Capstone" },
  },
  {
    project_id: "22222222-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    role: "contributor",
    projects: { name: "Robotics Club" },
  },
];

type FakeOptions = {
  user?: { id: string; email?: string } | null;
  memberships?: unknown[] | null;
  error?: { message: string } | null;
};

function fakeSupabase({
  user = USER,
  memberships = MEMBERSHIPS,
  error = null,
}: FakeOptions = {}) {
  // Every query method returns the same chain, and the last call in the
  // component's query, overrideTypes, resolves with the rows.
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const method of ["select", "eq", "order"]) {
    chain[method] = vi.fn(() => chain);
  }
  chain.overrideTypes = vi.fn(() =>
    Promise.resolve({ data: error ? null : memberships, error }),
  );
  const from = vi.fn(() => chain);
  const rpc = vi.fn();
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
  return { from, rpc, chain };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(cleanup);

describe("ProjectList, signed out", () => {
  test("sends the visitor to the sign-in page", async () => {
    fakeSupabase({ user: null });

    await expect(ProjectList()).rejects.toThrow("NEXT_REDIRECT");

    expect(redirect).toHaveBeenCalledWith("/sign-in");
  });

  test("reads nothing from any table", async () => {
    const { from, rpc } = fakeSupabase({ user: null });

    await expect(ProjectList()).rejects.toThrow("NEXT_REDIRECT");

    expect(from).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });
});

describe("ProjectList, signed in", () => {
  test("lists the user's projects, each linking to its own page", async () => {
    fakeSupabase();

    render(await ProjectList());

    const list = screen.getByRole("list", { name: "Your projects" });
    const links = within(list).getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual([
      "Capstone",
      "Robotics Club",
    ]);
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/projects/11111111-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      "/projects/22222222-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    ]);
  });

  test("shows the user's role in each project", async () => {
    fakeSupabase();

    render(await ProjectList());

    const items = within(
      screen.getByRole("list", { name: "Your projects" }),
    ).getAllByRole("listitem");
    expect(items[0].textContent).toContain("Overseer");
    expect(items[1].textContent).toContain("Contributor");
  });

  // Only the signed-in user's own memberships are asked for, and Row Level
  // Security gives no project to anyone who is not a member of it.
  test("asks only for the signed-in user's memberships", async () => {
    const { from, chain } = fakeSupabase();

    render(await ProjectList());

    expect(from).toHaveBeenCalledTimes(1);
    expect(from).toHaveBeenCalledWith("memberships");
    expect(chain.eq).toHaveBeenCalledWith("user_id", USER.id);
  });

  test("never asks for an invite code", async () => {
    const { chain, rpc } = fakeSupabase();

    render(await ProjectList());

    expect(String(chain.select.mock.calls[0][0])).not.toMatch(/invite/i);
    expect(rpc).not.toHaveBeenCalled();
  });

  test("shows who is signed in and a Sign out button", async () => {
    fakeSupabase();

    render(await ProjectList());

    expect(screen.getByText("bobbi@example.com")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeTruthy();
  });

  test("offers a form to create a project and a form to join one", async () => {
    fakeSupabase();

    render(await ProjectList());

    expect(screen.getByLabelText("Project name")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Create project" })).toBeTruthy();
    expect(screen.getByLabelText("Invite code")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Join project" })).toBeTruthy();
  });

  // A new account has no project until it creates or joins one. It can do
  // both from here, and it must still be able to sign out. (Moved from the
  // project log's tests, where this state used to live.)
  test("lets a user with no project create one, join one, or sign out", async () => {
    fakeSupabase({ memberships: [] });

    render(await ProjectList());

    expect(
      screen.getByText("You are not a member of a project yet."),
    ).toBeTruthy();
    expect(screen.queryByRole("list", { name: "Your projects" })).toBeNull();
    expect(screen.getByRole("button", { name: "Create project" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Join project" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeTruthy();
  });

  test("says so when the projects cannot be loaded, without the reason", async () => {
    fakeSupabase({ error: { message: "connection refused" } });

    render(await ProjectList());

    expect(screen.getByText("Your projects could not be loaded.")).toBeTruthy();
    expect(screen.queryByText(/connection refused/)).toBeNull();
  });

  // A row the query should never return. It is left out, not shown broken.
  test("leaves out a membership whose project did not come back", async () => {
    fakeSupabase({
      memberships: [
        MEMBERSHIPS[0],
        { project_id: "33333333", role: "contributor", projects: null },
      ],
    });

    render(await ProjectList());

    const links = within(
      screen.getByRole("list", { name: "Your projects" }),
    ).getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual(["Capstone"]);
  });
});
