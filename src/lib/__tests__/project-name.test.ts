import { describe, expect, test } from "vitest";
import { PROJECT_NAME_MAX_LENGTH, projectNameError } from "@/lib/project-name";

describe("projectNameError", () => {
  test("returns null for an ordinary name", () => {
    expect(projectNameError("Capstone Team 4")).toBeNull();
  });

  test.each(["", "   ", "\n\t"])("reports a name of %j as required", (name) => {
    expect(projectNameError(name)).toBe("Project name is required.");
  });

  test("allows a name of exactly the longest length", () => {
    expect(projectNameError("a".repeat(PROJECT_NAME_MAX_LENGTH))).toBeNull();
  });

  test("reports a name one character over the longest length", () => {
    expect(projectNameError("a".repeat(PROJECT_NAME_MAX_LENGTH + 1))).toBe(
      `Project name must be ${PROJECT_NAME_MAX_LENGTH} characters or fewer.`,
    );
  });

  // The name is saved trimmed, so the spaces around it do not count.
  test("measures the length without the spaces around the name", () => {
    const padded = `  ${"a".repeat(PROJECT_NAME_MAX_LENGTH)}  `;

    expect(projectNameError(padded)).toBeNull();
  });

  test("the longest length is 100 characters", () => {
    expect(PROJECT_NAME_MAX_LENGTH).toBe(100);
  });
});
