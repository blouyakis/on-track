import { describe, expect, test } from "vitest";
import { projectPath } from "@/lib/project-path";

describe("projectPath", () => {
  test("is the project's own page", () => {
    expect(projectPath("0b6f4a3e-7c1d-4e2a-9f5b-3d8c2a1e6f70")).toBe(
      "/projects/0b6f4a3e-7c1d-4e2a-9f5b-3d8c2a1e6f70",
    );
  });

  // An id is a UUID in practice. Anything else must not be able to change
  // which page the path points to.
  test("escapes characters that would change the path", () => {
    expect(projectPath("a/b?c#d")).toBe("/projects/a%2Fb%3Fc%23d");
  });
});
