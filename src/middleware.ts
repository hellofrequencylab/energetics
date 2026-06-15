import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { isCrossSiteMutation } from "@/lib/http/csrf";

export async function middleware(request: NextRequest) {
  // CSRF: reject cross-site, state-changing calls to the API before they reach a
  // handler (defense in depth alongside SameSite cookies).
  if (request.nextUrl.pathname.startsWith("/api/") && isCrossSiteMutation(request)) {
    return NextResponse.json({ error: "Cross-site request blocked." }, { status: 403 });
  }
  return updateSession(request);
}

export const config = {
  // Run on everything except static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
