import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import SignInPage from "@/app/sign-in/page";
import SignUpPage from "@/app/sign-up/page";

// The pages only place the form; the actions are covered by their own tests.
vi.mock("@/app/auth-actions", () => ({ signIn: vi.fn(), signUp: vi.fn() }));

afterEach(cleanup);

describe("sign-in page", () => {
  test("shows the app name, a Sign in heading and the sign-in form", () => {
    render(<SignInPage />);

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      "OnTrack",
    );
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe(
      "Sign in",
    );
    expect(screen.getByLabelText("Email")).toBeTruthy();
    expect(screen.getByLabelText("Password")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeTruthy();
  });

  test("shows nothing about any project", () => {
    render(<SignInPage />);

    expect(screen.queryByText(/project/i)).toBeNull();
  });
});

describe("sign-up page", () => {
  test("shows the app name, a Create your account heading and the sign-up form", () => {
    render(<SignUpPage />);

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      "OnTrack",
    );
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe(
      "Create your account",
    );
    expect(screen.getByLabelText("Email")).toBeTruthy();
    expect(screen.getByLabelText("Password")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Create account" })).toBeTruthy();
  });
});
