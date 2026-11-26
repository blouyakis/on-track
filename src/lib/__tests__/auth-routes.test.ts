import { describe, expect, test } from "vitest";
import {
  HOME_PATH,
  SIGN_IN_PATH,
  SIGN_UP_PATH,
  authRedirectFor,
} from "@/lib/auth-routes";

describe("authRedirectFor", () => {
  test("uses /sign-in, /sign-up and / as the paths", () => {
    expect(SIGN_IN_PATH).toBe("/sign-in");
    expect(SIGN_UP_PATH).toBe("/sign-up");
    expect(HOME_PATH).toBe("/");
  });

  test.each(["/", "/projects", "/projects/abc/entries", "/anything-else"])(
    "sends a signed-out visitor on %s to the sign-in page",
    (pathname) => {
      expect(authRedirectFor(pathname, false)).toBe(SIGN_IN_PATH);
    },
  );

  test.each([SIGN_IN_PATH, SIGN_UP_PATH])(
    "lets a signed-out visitor stay on %s",
    (pathname) => {
      expect(authRedirectFor(pathname, false)).toBeNull();
    },
  );

  test.each([SIGN_IN_PATH, SIGN_UP_PATH])(
    "sends a signed-in user on %s to the home page",
    (pathname) => {
      expect(authRedirectFor(pathname, true)).toBe(HOME_PATH);
    },
  );

  test.each(["/", "/projects", "/projects/abc/entries"])(
    "lets a signed-in user stay on %s",
    (pathname) => {
      expect(authRedirectFor(pathname, true)).toBeNull();
    },
  );

  test("treats a trailing slash as the same page", () => {
    expect(authRedirectFor("/sign-in/", false)).toBeNull();
    expect(authRedirectFor("/sign-up/", true)).toBe(HOME_PATH);
  });

  // Only an exact match is public. A path that merely starts with a public
  // one is protected like everything else.
  test.each(["/sign-in/extra", "/sign-in-other", "/sign-upgrade", "/SIGN-IN"])(
    "does not treat %s as a public page",
    (pathname) => {
      expect(authRedirectFor(pathname, false)).toBe(SIGN_IN_PATH);
    },
  );
});
