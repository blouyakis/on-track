import { redirect } from "next/navigation";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { createProject, joinProject } from "@/app/project-actions";
import { initialProjectFormState } from "@/app/project-form-state";
import {
  INVALID_INVITE_CODE_MESSAGE,
  INVITE_CODE_MAX_LENGTH,
} from "@/lib/invite-code";
import { PROJECT_NAME_MAX_LENGTH } from "@/lib/project-name";
import { createClient } from "@/utils/supabase/server";

// The database layer is mocked at the boundary: the actions only ever see
// this fake Supabase client.
vi.mock("@/utils/supabase/server", () => ({ createClient: vi.fn() }));

// The real redirect() throws to stop the action, so the fake does too.
const REDIRECT = "NEXT_REDIRECT";
vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

const USER_ID = "user-from-session";
const PROJECT_ID = "0b6f4a3e-7c1d-4e2a-9f5b-3d8c2a1e6f70";

type FakeOptions = {
  user?: { id: string } | null;
  // What the database function returns.
  rpcData?: unknown;
  rpcError?: { message: string } | null;
};

function fakeSupabase({
  user = { id: USER_ID },
  rpcData = PROJECT_ID,
  rpcError = null,
}: FakeOptions = {}) {
  const rpc = vi.fn().mockResolvedValue({
    data: rpcError ? null : rpcData,
    error: rpcError,
  });
  const from = vi.fn();
  const client = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
    },
    rpc,
    from,
  };
  vi.mocked(createClient).mockResolvedValue(
    client as unknown as Awaited<ReturnType<typeof createClient>>,
  );
  return { rpc, from };
}

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [name, value] of Object.entries(fields)) data.set(name, value);
  return data;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("createProject", () => {
  test("returns an error and creates nothing when nobody is signed in", async () => {
    const { rpc } = fakeSupabase({ user: null });

    const state = await createProject(
      initialProjectFormState,
      form({ name: "Capstone" }),
    );

    expect(state.status).toBe("error");
    expect(state.message).toBe("Sign in to create a project.");
    expect(rpc).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  // The server checks the name itself, whatever the browser allowed.
  test.each(["", "   "])(
    "returns a field error and creates nothing when the name is %j",
    async (name) => {
      const { rpc } = fakeSupabase();

      const state = await createProject(
        initialProjectFormState,
        form({ name }),
      );

      expect(state.status).toBe("error");
      expect(state.fieldError).toBe("Project name is required.");
      expect(rpc).not.toHaveBeenCalled();
    },
  );

  test("returns a field error and creates nothing when the name is too long", async () => {
    const { rpc } = fakeSupabase();
    const name = "a".repeat(PROJECT_NAME_MAX_LENGTH + 1);

    const state = await createProject(initialProjectFormState, form({ name }));

    expect(state.fieldError).toBe(
      `Project name must be ${PROJECT_NAME_MAX_LENGTH} characters or fewer.`,
    );
    // What the user typed comes back, so the form is not emptied.
    expect(state.value).toBe(name);
    expect(rpc).not.toHaveBeenCalled();
  });

  test("creates the project with the trimmed name and opens it", async () => {
    const { rpc } = fakeSupabase();

    await expect(
      createProject(initialProjectFormState, form({ name: "  Capstone  " })),
    ).rejects.toThrow(REDIRECT);

    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith("create_project", { p_name: "Capstone" });
    expect(redirect).toHaveBeenCalledWith(`/projects/${PROJECT_ID}`);
  });

  // The database function makes the caller the overseer from the session.
  // Nothing in the form can name a user, a role or an invite code.
  test("sends only the name, whatever else the form contains", async () => {
    const { rpc, from } = fakeSupabase();

    await expect(
      createProject(
        initialProjectFormState,
        form({
          name: "Capstone",
          role: "contributor",
          user_id: "someone-else",
          created_by: "someone-else",
          invite_code: "MY-OWN-CODE",
        }),
      ),
    ).rejects.toThrow(REDIRECT);

    expect(rpc).toHaveBeenCalledWith("create_project", { p_name: "Capstone" });
    // No table is written to directly.
    expect(from).not.toHaveBeenCalled();
  });

  test("returns a generic message when the database rejects the project", async () => {
    fakeSupabase({
      rpcError: { message: 'permission denied for function "create_project"' },
    });

    const state = await createProject(
      initialProjectFormState,
      form({ name: "Capstone" }),
    );

    expect(state.status).toBe("error");
    expect(state.message).toBe("The project could not be created. Try again.");
    expect(state.value).toBe("Capstone");
    expect(redirect).not.toHaveBeenCalled();
    // The reason goes to the server log, not to the user.
    expect(console.error).toHaveBeenCalled();
  });

  test("returns the generic message when the database returns no project id", async () => {
    fakeSupabase({ rpcData: null });

    const state = await createProject(
      initialProjectFormState,
      form({ name: "Capstone" }),
    );

    expect(state.status).toBe("error");
    expect(state.message).toBe("The project could not be created. Try again.");
    expect(redirect).not.toHaveBeenCalled();
  });
});

describe("joinProject", () => {
  test("returns an error and joins nothing when nobody is signed in", async () => {
    const { rpc } = fakeSupabase({ user: null });

    const state = await joinProject(
      initialProjectFormState,
      form({ invite_code: "K7QXM-2RDTP" }),
    );

    expect(state.status).toBe("error");
    expect(state.message).toBe("Sign in to join a project.");
    expect(rpc).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  test.each(["", "   "])(
    "returns a field error and asks the database nothing when the code is %j",
    async (invite_code) => {
      const { rpc } = fakeSupabase();

      const state = await joinProject(
        initialProjectFormState,
        form({ invite_code }),
      );

      expect(state.status).toBe("error");
      expect(state.fieldError).toBe("Invite code is required.");
      expect(rpc).not.toHaveBeenCalled();
    },
  );

  test("rejects a code too long to be real without asking the database", async () => {
    const { rpc } = fakeSupabase();

    const state = await joinProject(
      initialProjectFormState,
      form({ invite_code: "A".repeat(INVITE_CODE_MAX_LENGTH + 1) }),
    );

    expect(state.fieldError).toBe(INVALID_INVITE_CODE_MESSAGE);
    expect(rpc).not.toHaveBeenCalled();
  });

  test("joins with the normalized code and opens the project", async () => {
    const { rpc } = fakeSupabase();

    await expect(
      joinProject(
        initialProjectFormState,
        form({ invite_code: "  k7qxm-2rdtp " }),
      ),
    ).rejects.toThrow(REDIRECT);

    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith("join_project", {
      p_invite_code: "K7QXM-2RDTP",
    });
    expect(redirect).toHaveBeenCalledWith(`/projects/${PROJECT_ID}`);
  });

  // The database function makes the caller a contributor from the session.
  // Nothing in the form can name a user, a role or a project.
  test("sends only the code, whatever else the form contains", async () => {
    const { rpc, from } = fakeSupabase();

    await expect(
      joinProject(
        initialProjectFormState,
        form({
          invite_code: "K7QXM-2RDTP",
          role: "overseer",
          user_id: "someone-else",
          project_id: "another-project",
        }),
      ),
    ).rejects.toThrow(REDIRECT);

    expect(rpc).toHaveBeenCalledWith("join_project", {
      p_invite_code: "K7QXM-2RDTP",
    });
    // No table is read or written directly.
    expect(from).not.toHaveBeenCalled();
  });

  // An invalid code shows an error and reveals nothing about any project.
  test("returns only the fixed message for a code no project has", async () => {
    fakeSupabase({ rpcData: null });

    const state = await joinProject(
      initialProjectFormState,
      form({ invite_code: "WRONG-CODE9" }),
    );

    expect(state).toEqual({
      status: "error",
      message: null,
      fieldError: INVALID_INVITE_CODE_MESSAGE,
      value: "WRONG-CODE9",
    });
    expect(redirect).not.toHaveBeenCalled();
  });

  // A failed lookup must look the same as an unknown code, so the answer
  // never depends on what is in the database.
  test("returns the same state when the database fails as for an unknown code", async () => {
    fakeSupabase({ rpcData: null });
    const unknown = await joinProject(
      initialProjectFormState,
      form({ invite_code: "WRONG-CODE9" }),
    );

    fakeSupabase({
      rpcError: { message: 'relation "public.projects" is locked' },
    });
    const failed = await joinProject(
      initialProjectFormState,
      form({ invite_code: "WRONG-CODE9" }),
    );

    expect(failed).toEqual(unknown);
    expect(JSON.stringify(failed)).not.toMatch(/projects|locked/);
    expect(redirect).not.toHaveBeenCalled();
    // The reason goes to the server log, not to the user.
    expect(console.error).toHaveBeenCalled();
  });
});
