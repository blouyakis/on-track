// Which pages need a session. Every page does, except the two a signed-out
// visitor uses to get one. The proxy applies this rule to each request; the
// pages and server actions still check the session themselves.

export const SIGN_IN_PATH = "/sign-in";
export const SIGN_UP_PATH = "/sign-up";
export const HOME_PATH = "/";

const PUBLIC_PATHS: readonly string[] = [SIGN_IN_PATH, SIGN_UP_PATH];

function withoutTrailingSlash(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith("/")
    ? pathname.slice(0, -1)
    : pathname;
}

// Returns the path to redirect to, or null when the visitor may stay.
export function authRedirectFor(
  pathname: string,
  isSignedIn: boolean,
): string | null {
  // Exact matches only, so a new page is protected unless it is listed.
  const isPublic = PUBLIC_PATHS.includes(withoutTrailingSlash(pathname));

  if (!isSignedIn) return isPublic ? null : SIGN_IN_PATH;
  return isPublic ? HOME_PATH : null;
}
