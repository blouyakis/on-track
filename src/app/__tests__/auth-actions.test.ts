import { redirect } from "next/navigation";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { signUp } from "@/app/auth-actions";
import { initialAuthFormState } from "@/app/auth-form-state";
import { createClient } from "@/utils/supabase/server";

// Supabase is mocked at the boundary: the actions only ever see this fake
// client.
vi.mock("@/utils/supabase/server", () => ({ createClient: vi.fn() }));

// The real redirect() throws to stop the action, so the fake does too.
const REDIRECT = "NEXT_REDIRECT";
vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

type AuthError = { message: string } | null;

type FakeOptions = {
  // What auth.signUp returns as the session. Null means the project asks for
  // the email to be confirmed first.
  signUpSession?: { access_token: string } | null;
  signUpError?: AuthError;
};

function fakeSupabase({
  signUpSession = { access_token: "token" },
  signUpError = null,
}: FakeOptions = {}) {
  const auth = {
    signUp: vi.fn().mockResolvedValue({
      data: {
        user: signUpError ? null : { id: "new-user" },
        session: signUpError ? null : signUpSession,
      },
      error: signUpError,
    }),
  };
  vi.mocked(createClient).mockResolvedValue({ auth } as unknown as Awaited<
    ReturnType<typeof createClient>
  >);
  return auth;
}

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [name, value] of Object.entries(fields)) data.set(name, value);
  return data;
}

const EMAIL = "bobbi@example.com";
const PASSWORD = "long-enough-1";

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("signUp", () => {
  test("creates the account and sends the new user to the home page", async () => {
    const auth = fakeSupabase();

    await expect(
      signUp(initialAuthFormState, form({ email: EMAIL, password: PASSWORD })),
    ).rejects.toThrow(REDIRECT);

    expect(auth.signUp).toHaveBeenCalledTimes(1);
    expect(auth.signUp).toHaveBeenCalledWith({
      email: EMAIL,
      password: PASSWORD,
    });
    expect(redirect).toHaveBeenCalledWith("/");
  });

  test("trims the email but not the password", async () => {
    const auth = fakeSupabase();

    await expect(
      signUp(
        initialAuthFormState,
        form({ email: `  ${EMAIL} `, password: "  spaces kept  " }),
      ),
    ).rejects.toThrow(REDIRECT);

    expect(auth.signUp).toHaveBeenCalledWith({
      email: EMAIL,
      password: "  spaces kept  ",
    });
  });

  test("asks the user to confirm their email when no session is returned", async () => {
    fakeSupabase({ signUpSession: null });

    const state = await signUp(
      initialAuthFormState,
      form({ email: EMAIL, password: PASSWORD }),
    );

    expect(state.status).toBe("success");
    expect(state.message).toBe(
      "Check your email to confirm your account, then sign in.",
    );
    expect(redirect).not.toHaveBeenCalled();
  });

  test("returns a field error and never calls Supabase for an invalid email", async () => {
    const auth = fakeSupabase();

    const state = await signUp(
      initialAuthFormState,
      form({ email: "not-an-email", password: PASSWORD }),
    );

    expect(state.status).toBe("error");
    expect(state.fieldErrors.email).toBe("Enter a valid email address.");
    expect(state.fieldErrors.password).toBeUndefined();
    expect(auth.signUp).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  test("returns a field error and never calls Supabase for a short password", async () => {
    const auth = fakeSupabase();

    const state = await signUp(
      initialAuthFormState,
      form({ email: EMAIL, password: "short" }),
    );

    expect(state.status).toBe("error");
    expect(state.fieldErrors.password).toBe(
      "Password must be at least 8 characters.",
    );
    expect(auth.signUp).not.toHaveBeenCalled();
  });

  test("treats missing form fields as empty, not as a crash", async () => {
    const auth = fakeSupabase();

    const state = await signUp(initialAuthFormState, new FormData());

    expect(state.fieldErrors.email).toBe("Email is required.");
    expect(state.fieldErrors.password).toBe("Password is required.");
    expect(auth.signUp).not.toHaveBeenCalled();
  });

  test("sends the email back on an error, and never the password", async () => {
    fakeSupabase();

    const state = await signUp(
      initialAuthFormState,
      form({ email: EMAIL, password: "short" }),
    );

    expect(state.email).toBe(EMAIL);
    expect(JSON.stringify(state)).not.toContain("short");
  });
});
