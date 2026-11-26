// @vitest-environment node
import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { config, proxy } from "@/proxy";
import { updateSession } from "@/utils/supabase/proxy";

vi.mock("@/utils/supabase/proxy", () => ({ updateSession: vi.fn() }));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("proxy", () => {
  test("hands the request to updateSession and returns its response", async () => {
    const response = NextResponse.next();
    vi.mocked(updateSession).mockResolvedValue(response);
    const request = new NextRequest("http://localhost:3000/");

    await expect(proxy(request)).resolves.toBe(response);

    expect(updateSession).toHaveBeenCalledTimes(1);
    expect(updateSession).toHaveBeenCalledWith(request);
  });
});

// Next.js compiles the matcher itself, and its test helper does not load
// outside the Next.js runtime. This reads the pattern as the plain regular
// expression it is, anchored the way Next.js anchors it. Whether static files
// really skip the proxy is also checked by hand against a running server.
describe("config.matcher", () => {
  function isMatched(pathname: string) {
    return config.matcher.some((source) =>
      new RegExp(`^${source}$`).test(pathname),
    );
  }

  test.each([
    "/",
    "/sign-in",
    "/sign-up",
    "/projects",
    "/projects/abc/entries",
  ])("runs the proxy on %s", (pathname) => {
    expect(isMatched(pathname)).toBe(true);
  });

  test.each([
    "/_next/static/chunks/main.js",
    "/_next/static/css/app.css",
    "/_next/image",
    "/favicon.ico",
    "/next.svg",
    "/logo.png",
    "/photo.jpg",
  ])("skips the static file %s", (pathname) => {
    expect(isMatched(pathname)).toBe(false);
  });
});
