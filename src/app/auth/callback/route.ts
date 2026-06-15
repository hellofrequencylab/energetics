import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { EmailOtpType } from "@supabase/supabase-js";
import { DB_SCHEMA } from "@/lib/supabase/schema";
import { safeNextPath } from "@/lib/auth/safe-next";

export const runtime = "nodejs";

/**
 * GET /auth/callback — completes magic-link sign in.
 *
 * Exchanges the PKCE `?code=` (or verifies a `?token_hash=`) for a session, then
 * redirects to `next`. Critically, the session cookies are written onto the
 * redirect *response* itself: setting them via the Next cookie store alone does
 * not attach them to a redirect, which previously left the next page with no
 * session and bounced the user back to /login.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  // `next` is attacker-influenced (it travels in emailed links), so it is
  // sanitized to a same-site path before it is ever used as a redirect target.
  const next = safeNextPath(searchParams.get("next"));

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const failure = NextResponse.redirect(`${origin}/login?error=auth-callback`);
  if (!url || !key) return failure;

  const cookieStore = await cookies();
  const success = NextResponse.redirect(`${origin}${next}`);

  const supabase = createServerClient(url, key, {
    db: { schema: DB_SCHEMA },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        // Write session cookies onto the redirect we return, so they persist.
        for (const { name, value, options } of cookiesToSet) {
          success.cookies.set(name, value, options);
        }
      },
    },
  });

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return success;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return success;
  }

  return failure;
}
