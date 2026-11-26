import { describe, expect, test } from "vitest";
import {
  INVALID_INVITE_CODE_MESSAGE,
  INVITE_CODE_MAX_LENGTH,
  inviteCodeError,
  normalizeInviteCode,
} from "@/lib/invite-code";

describe("normalizeInviteCode", () => {
  test("leaves a code that is already in its stored form alone", () => {
    expect(normalizeInviteCode("K7QXM-2RDTP")).toBe("K7QXM-2RDTP");
  });

  test("makes lower-case letters upper case", () => {
    expect(normalizeInviteCode("k7qxm-2rdtp")).toBe("K7QXM-2RDTP");
  });

  test("removes the spaces around a pasted code", () => {
    expect(normalizeInviteCode("  K7QXM-2RDTP\n")).toBe("K7QXM-2RDTP");
  });

  test("removes spaces inside the code", () => {
    expect(normalizeInviteCode("K7QXM -\t2RDTP")).toBe("K7QXM-2RDTP");
  });

  test("returns an empty string for a blank code", () => {
    expect(normalizeInviteCode("   ")).toBe("");
  });
});

describe("inviteCodeError", () => {
  test("returns null for a code that could exist", () => {
    expect(inviteCodeError("K7QXM-2RDTP")).toBeNull();
  });

  test.each(["", "   "])("reports a code of %j as required", (code) => {
    expect(inviteCodeError(code)).toBe("Invite code is required.");
  });

  // Too long to be a real code, so it is rejected without asking the
  // database, with the message an unknown code gets.
  test("reports an over-long code with the same message as an unknown one", () => {
    const tooLong = "A".repeat(INVITE_CODE_MAX_LENGTH + 1);

    expect(inviteCodeError(tooLong)).toBe(INVALID_INVITE_CODE_MESSAGE);
  });

  test("allows a code of exactly the longest length", () => {
    expect(inviteCodeError("A".repeat(INVITE_CODE_MAX_LENGTH))).toBeNull();
  });

  test("measures the length after the code is normalized", () => {
    const padded = `  ${"A".repeat(INVITE_CODE_MAX_LENGTH)}  `;

    expect(inviteCodeError(padded)).toBeNull();
  });
});

describe("INVALID_INVITE_CODE_MESSAGE", () => {
  // Whatever went wrong, the message must not say whether a project exists.
  test("says nothing about any project", () => {
    expect(INVALID_INVITE_CODE_MESSAGE).toBe("That invite code is not valid.");
  });
});
