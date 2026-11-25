// @vitest-environment node
import { createServerClient } from "@supabase/ssr";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { updateSession } from "@/utils/supabase/proxy";

// Supabase is mocked at the boundary. The fake keeps the cookie methods the
// proxy hands it, so a test can make it "refresh" the session the way the
// real client does: by calling setAll during getClaims.
vi.mock("@supabase/ssr", () => ({ createServerClient: vi.fn() }));

type Cookie = { name: string; value: string };
type CookieToSet = Cookie & { options: Record<string, unknown> };
type CookieMethods = {
  getAll: () => Cookie[];
  setAll: (cookies: CookieToSet[], headers: Record<string, string>) => void;
};

const NO_STORE = {
  "Cache-Control": "private, no-cache, no-store, must-revalidate, max-age=0",
};

type FakeOptions = {
  signedIn?: boolean;
  // Cookies the client writes while checking the session, as it does after
  // exchanging an expired access token for a new one.
  refreshed?: CookieToSet[];
  claimsError?: { message: string } | null;
  throws?: Error;
};

function fakeSupabase({
  signedIn = false,
  refreshed = [],
  claimsError = null,
  throws,
}: FakeOptions = {}) {
  const getClaims = vi.fn();
  const seen: { cookies: Cookie[] } = { cookies: [] };

  vi.mocked(createServerClient).mockImplementation((_url, _key, options) => {
    const cookies = options.cookies as unknown as CookieMethods;
    getClaims.mockImplementation(async () => {
      seen.cookies = cookies.getAll();
      if (throws) throw throws;
      if (refreshed.length > 0) cookies.setAll(refreshed, NO_STORE);
      if (claimsError) return { data: null, error: claimsError };
      return {
        data: signedIn ? { claims: { sub: "user-id" } } : null,
        error: null,
      };
    });
    return { auth: { getClaims } } as unknown as ReturnType<
      typeof createServerClient
    >;
  });

  return { getClaims, seen };
}

const ORIGIN = "http://localhost:3000";

function request(path: string, cookie?: string) {
  return new NextRequest(`${ORIGIN}${path}`, {
    headers: cookie ? { cookie } : undefined,
  });
}

function isPassThrough(response: Response) {
  return (
    response.headers.get("x-middleware-next") === "1" &&
    response.headers.get("location") === null
  );
}

const REFRESHED: CookieToSet[] = [
  {
    name: "sb-test-auth-token",
    value: "fresh-token",
    options: { path: "/", httpOnly: true, sameSite: "lax", maxAge: 3600 },
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("updateSession", () => {
  test("checks the session with Supabase on every request, using the request's cookies", async () => {
    const { getClaims, seen } = fakeSupabase({ signedIn: true });

    await updateSession(request("/", "sb-test-auth-token=old-token"));

    expect(createServerClient).toHaveBeenCalledTimes(1);
    expect(getClaims).toHaveBeenCalledTimes(1);
    expect(seen.cookies).toEqual([
      { name: "sb-test-auth-token", value: "old-token" },
    ]);
  });

  test("makes a new Supabase client for each request", async () => {
    fakeSupabase({ signedIn: true });

    await updateSession(request("/"));
    await updateSession(request("/"));

    expect(createServerClient).toHaveBeenCalledTimes(2);
  });

  test("sends a signed-out visitor to the sign-in page", async () => {
    fakeSupabase({ signedIn: false });

    const response = await updateSession(request("/"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(`${ORIGIN}/sign-in`);
  });

  test("drops the query string when it redirects", async () => {
    fakeSupabase({ signedIn: false });

    const response = await updateSession(request("/projects?next=/evil"));

    expect(response.headers.get("location")).toBe(`${ORIGIN}/sign-in`);
  });

  test.each(["/sign-in", "/sign-up"])(
    "lets a signed-out visitor through to %s",
    async (path) => {
      fakeSupabase({ signedIn: false });

      const response = await updateSession(request(path));

      expect(isPassThrough(response)).toBe(true);
    },
  );

  test("lets a signed-in user through to the home page", async () => {
    fakeSupabase({ signedIn: true });

    const response = await updateSession(request("/"));

    expect(isPassThrough(response)).toBe(true);
  });

  test("sends a signed-in user away from the sign-in page", async () => {
    fakeSupabase({ signedIn: true });

    const response = await updateSession(request("/sign-in"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(`${ORIGIN}/`);
  });

  test("puts a refreshed session on the response, for the browser", async () => {
    fakeSupabase({ signedIn: true, refreshed: REFRESHED });

    const response = await updateSession(
      request("/", "sb-test-auth-token=old-token"),
    );

    const cookie = response.cookies.get("sb-test-auth-token");
    expect(cookie?.value).toBe("fresh-token");
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.maxAge).toBe(3600);
  });

  test("passes a refreshed session on to the page that renders next", async () => {
    fakeSupabase({ signedIn: true, refreshed: REFRESHED });

    const response = await updateSession(
      request("/", "sb-test-auth-token=old-token"),
    );

    // How Next.js forwards changed request cookies from the proxy.
    const forwarded = response.headers.get("x-middleware-request-cookie");
    expect(forwarded).toContain("sb-test-auth-token=fresh-token");
    expect(forwarded).not.toContain("old-token");
  });

  // A response that sets a session cookie must not be stored by a shared
  // cache, or one user's session could be served to another.
  test("marks a response that carries a refreshed session as not cacheable", async () => {
    fakeSupabase({ signedIn: true, refreshed: REFRESHED });

    const response = await updateSession(request("/"));

    expect(response.headers.get("cache-control")).toBe(
      NO_STORE["Cache-Control"],
    );
  });

  test("keeps a refreshed session when it redirects", async () => {
    fakeSupabase({ signedIn: true, refreshed: REFRESHED });

    const response = await updateSession(request("/sign-in"));

    expect(response.headers.get("location")).toBe(`${ORIGIN}/`);
    expect(response.cookies.get("sb-test-auth-token")?.value).toBe(
      "fresh-token",
    );
    expect(response.headers.get("cache-control")).toBe(
      NO_STORE["Cache-Control"],
    );
  });

  test("treats a session Supabase rejects as signed out", async () => {
    fakeSupabase({ claimsError: { message: "invalid JWT" } });

    const response = await updateSession(request("/", "sb-test-auth-token=x"));

    expect(response.headers.get("location")).toBe(`${ORIGIN}/sign-in`);
  });

  // If the check itself breaks, nobody is let through, but the sign-in page
  // still loads instead of every page failing.
  test("treats a failed check as signed out, and logs it", async () => {
    fakeSupabase({ throws: new Error("fetch failed") });

    const protectedPage = await updateSession(request("/"));
    const signInPage = await updateSession(request("/sign-in"));

    expect(protectedPage.headers.get("location")).toBe(`${ORIGIN}/sign-in`);
    expect(isPassThrough(signInPage)).toBe(true);
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).toContain(
      "fetch failed",
    );
  });
});
