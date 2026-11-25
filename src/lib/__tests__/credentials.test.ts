import { describe, expect, test } from "vitest";
import { validateCredentials } from "@/lib/credentials";

const valid = { email: "bobbi@example.com", password: "long-enough-1" };

describe("validateCredentials", () => {
  test.each(["sign-up", "sign-in"] as const)(
    "returns no errors for a valid email and password on %s",
    (mode) => {
      expect(validateCredentials(valid, mode)).toEqual([]);
    },
  );

  test.each(["", "   "])("reports the email when it is %j", (email) => {
    const errors = validateCredentials({ ...valid, email }, "sign-up");

    expect(errors).toEqual([{ field: "email", message: "Email is required." }]);
  });

  test.each([
    "bobbi",
    "bobbi@",
    "@example.com",
    "bobbi@example",
    "bobbi @example.com",
    "bobbi@@example.com",
  ])("reports the email when %j is not an email address", (email) => {
    const errors = validateCredentials({ ...valid, email }, "sign-up");

    expect(errors).toEqual([
      { field: "email", message: "Enter a valid email address." },
    ]);
  });

  test("accepts an email with spaces around it", () => {
    const errors = validateCredentials(
      { ...valid, email: "  bobbi@example.com " },
      "sign-up",
    );

    expect(errors).toEqual([]);
  });

  test("reports an email longer than 254 characters", () => {
    const email = `${"a".repeat(243)}@example.com`;
    expect(email).toHaveLength(255);

    const errors = validateCredentials({ ...valid, email }, "sign-up");

    expect(errors.map((error) => error.field)).toEqual(["email"]);
  });

  test.each(["sign-up", "sign-in"] as const)(
    "reports the password when it is empty on %s",
    (mode) => {
      const errors = validateCredentials({ ...valid, password: "" }, mode);

      expect(errors).toEqual([
        { field: "password", message: "Password is required." },
      ]);
    },
  );

  test("reports a password shorter than 8 characters on sign-up", () => {
    const errors = validateCredentials(
      { ...valid, password: "1234567" },
      "sign-up",
    );

    expect(errors).toEqual([
      {
        field: "password",
        message: "Password must be at least 8 characters.",
      },
    ]);
  });

  test("accepts a password of exactly 8 characters on sign-up", () => {
    const errors = validateCredentials(
      { ...valid, password: "12345678" },
      "sign-up",
    );

    expect(errors).toEqual([]);
  });

  test("accepts a password of exactly 72 characters on sign-up", () => {
    const errors = validateCredentials(
      { ...valid, password: "a".repeat(72) },
      "sign-up",
    );

    expect(errors).toEqual([]);
  });

  test("reports a password longer than 72 characters on sign-up", () => {
    const errors = validateCredentials(
      { ...valid, password: "a".repeat(73) },
      "sign-up",
    );

    expect(errors).toEqual([
      {
        field: "password",
        message: "Password must be 72 characters or fewer.",
      },
    ]);
  });

  // bcrypt reads 72 bytes, not 72 characters. An accented letter is two
  // bytes and an emoji is four, so these are over the limit while looking
  // well under it.
  test.each([
    ["37 accented letters (74 bytes)", "é".repeat(37)],
    ["19 emoji (76 bytes)", "😀".repeat(19)],
    ["70 letters and one emoji (74 bytes)", `${"a".repeat(70)}😀`],
  ])("reports a password of %s on sign-up", (_label, password) => {
    expect(password.length).toBeLessThanOrEqual(72);

    const errors = validateCredentials({ ...valid, password }, "sign-up");

    expect(errors).toEqual([
      {
        field: "password",
        message:
          "Password is too long. Accented letters and emoji count as more than one character.",
      },
    ]);
  });

  test.each([
    ["36 accented letters (72 bytes)", "é".repeat(36)],
    ["18 emoji (72 bytes)", "😀".repeat(18)],
    ["68 letters and one emoji (72 bytes)", `${"a".repeat(68)}😀`],
  ])("accepts a password of %s on sign-up", (_label, password) => {
    const errors = validateCredentials({ ...valid, password }, "sign-up");

    expect(errors).toEqual([]);
  });

  // An existing account's password is whatever it already is. The length
  // rules apply when a password is chosen, not when it is checked.
  test("does not apply the length rules on sign-in", () => {
    expect(
      validateCredentials({ ...valid, password: "short" }, "sign-in"),
    ).toEqual([]);
  });

  test("does not trim the password", () => {
    const errors = validateCredentials(
      { ...valid, password: "        " },
      "sign-up",
    );

    expect(errors).toEqual([]);
  });

  test("reports both fields, email first", () => {
    const errors = validateCredentials({ email: "", password: "" }, "sign-up");

    expect(errors.map((error) => error.field)).toEqual(["email", "password"]);
  });
});
