import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { signIn, signUp } from "@/app/auth-actions";
import type { AuthFormState } from "@/app/auth-form-state";
import { AuthForm } from "@/components/auth-form";

// The server actions are replaced: these tests cover what the form renders
// and what it sends.
vi.mock("@/app/auth-actions", () => ({ signIn: vi.fn(), signUp: vi.fn() }));

beforeEach(() => {
  vi.clearAllMocks();
});
afterEach(cleanup);

function email() {
  return screen.getByLabelText("Email") as HTMLInputElement;
}

function password() {
  return screen.getByLabelText("Password") as HTMLInputElement;
}

function submit(button: string) {
  const form = screen.getByRole("button", { name: button }).closest("form");
  if (!form) throw new Error("The button is not inside a form.");
  fireEvent.submit(form);
}

describe("AuthForm", () => {
  test.each(["sign-in", "sign-up"] as const)(
    "shows a required email and password field on %s",
    (mode) => {
      render(<AuthForm mode={mode} />);

      expect(email().type).toBe("email");
      expect(email().name).toBe("email");
      expect(email().required).toBe(true);
      expect(email().autocomplete).toBe("email");

      expect(password().type).toBe("password");
      expect(password().name).toBe("password");
      expect(password().required).toBe(true);
    },
  );

  test("sign-in has a Sign in button and a link to create an account", () => {
    render(<AuthForm mode="sign-in" />);

    expect(screen.getByRole("button", { name: "Sign in" })).toBeTruthy();
    expect(password().autocomplete).toBe("current-password");
    expect(
      screen
        .getByRole("link", { name: "Create an account" })
        .getAttribute("href"),
    ).toBe("/sign-up");
  });

  test("sign-up has a Create account button and a link to sign in", () => {
    render(<AuthForm mode="sign-up" />);

    expect(screen.getByRole("button", { name: "Create account" })).toBeTruthy();
    expect(password().autocomplete).toBe("new-password");
    expect(
      screen.getByRole("link", { name: "Sign in" }).getAttribute("href"),
    ).toBe("/sign-in");
  });

  test("sign-up says how long the password must be; sign-in does not", () => {
    const { unmount } = render(<AuthForm mode="sign-up" />);
    expect(password().minLength).toBe(8);
    expect(screen.getByText("At least 8 characters.")).toBeTruthy();
    unmount();

    render(<AuthForm mode="sign-in" />);
    expect(password().minLength).toBe(-1);
    expect(screen.queryByText("At least 8 characters.")).toBeNull();
  });

  test("sign-in sends what was typed to the signIn action", async () => {
    vi.mocked(signIn).mockResolvedValue({
      status: "idle",
      message: null,
      fieldErrors: {},
      email: "",
    });
    render(<AuthForm mode="sign-in" />);

    fireEvent.change(email(), { target: { value: "bobbi@example.com" } });
    fireEvent.change(password(), { target: { value: "long-enough-1" } });
    submit("Sign in");

    await waitFor(() => expect(signIn).toHaveBeenCalledTimes(1));
    const formData = vi.mocked(signIn).mock.calls[0][1];
    expect(formData.get("email")).toBe("bobbi@example.com");
    expect(formData.get("password")).toBe("long-enough-1");
    expect(signUp).not.toHaveBeenCalled();
  });

  test("sign-up sends what was typed to the signUp action", async () => {
    vi.mocked(signUp).mockResolvedValue({
      status: "idle",
      message: null,
      fieldErrors: {},
      email: "",
    });
    render(<AuthForm mode="sign-up" />);

    fireEvent.change(email(), { target: { value: "ziye@example.com" } });
    fireEvent.change(password(), { target: { value: "long-enough-2" } });
    submit("Create account");

    await waitFor(() => expect(signUp).toHaveBeenCalledTimes(1));
    const formData = vi.mocked(signUp).mock.calls[0][1];
    expect(formData.get("email")).toBe("ziye@example.com");
    expect(formData.get("password")).toBe("long-enough-2");
    expect(signIn).not.toHaveBeenCalled();
  });

  test("shows the server's message and field errors, and keeps the email", async () => {
    const rejected: AuthFormState = {
      status: "error",
      message:
        "Could not sign in. Check your email and password and try again.",
      fieldErrors: {
        email: "Enter a valid email address.",
        password: "Password is required.",
      },
      email: "bobbi@example.com",
    };
    vi.mocked(signIn).mockResolvedValue(rejected);
    render(<AuthForm mode="sign-in" />);

    submit("Sign in");

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toBe(rejected.message);
    expect(screen.getByText("Enter a valid email address.")).toBeTruthy();
    expect(screen.getByText("Password is required.")).toBeTruthy();
    expect(email().value).toBe("bobbi@example.com");
    expect(password().value).toBe("");
  });

  test("shows a success message as a status, not as an error", async () => {
    vi.mocked(signUp).mockResolvedValue({
      status: "success",
      message: "Check your email to confirm your account, then sign in.",
      fieldErrors: {},
      email: "",
    });
    render(<AuthForm mode="sign-up" />);

    submit("Create account");

    const status = await screen.findByRole("status");
    expect(status.textContent).toBe(
      "Check your email to confirm your account, then sign in.",
    );
    expect(screen.queryByRole("alert")).toBeNull();
  });

  test("shows no message before the form is submitted", () => {
    render(<AuthForm mode="sign-in" />);

    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByRole("status")).toBeNull();
  });
});
