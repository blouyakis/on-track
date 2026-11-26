import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { authRedirectFor } from "@/lib/auth-routes";

// Runs in the proxy on each request. It asks Supabase to check the session,
// which exchanges an expired access token for a new one, and hands the new
// session to both the browser and the page that renders next. Server
// Components cannot write cookies, so this is the one place a session is
// refreshed.
//
// The redirect here is a first filter only. Pages and server actions still
// check the session themselves, and Row Level Security checks it again.
export async function updateSession(
  request: NextRequest,
): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  // A new client per request: it holds this request's cookies.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          // For the page that renders next: update the request, then rebuild
          // the response so Next.js forwards the changed cookies.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          // For the browser. The headers stop shared caches from storing a
          // response that carries a session.
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          Object.entries(headers).forEach(([name, value]) =>
            response.headers.set(name, value),
          );
        },
      },
    },
  );

  const isSignedIn = await hasSession(supabase);

  const target = authRedirectFor(request.nextUrl.pathname, isSignedIn);
  if (!target) return response;

  const url = request.nextUrl.clone();
  url.pathname = target;
  url.search = "";
  const redirectResponse = NextResponse.redirect(url);
  // Keep whatever the session check wrote.
  response.cookies
    .getAll()
    .forEach((cookie) => redirectResponse.cookies.set(cookie));
  const cacheControl = response.headers.get("cache-control");
  if (cacheControl) redirectResponse.headers.set("cache-control", cacheControl);
  return redirectResponse;
}

// A check that fails counts as signed out, so nobody is let through, and the
// sign-in page still loads.
async function hasSession(
  supabase: ReturnType<typeof createServerClient>,
): Promise<boolean> {
  try {
    const { data, error } = await supabase.auth.getClaims();
    return !error && Boolean(data?.claims);
  } catch (error) {
    console.error(
      "Checking the session failed:",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}
