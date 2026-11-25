import type { NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Every path except Next.js's own static files and images. Without this the
  // proxy would also run on the styles and scripts the sign-in page needs.
  // Next.js reads this at build time, so it has to stay a literal.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
