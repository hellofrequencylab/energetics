import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * GET /auth/callback — completes magic-link sign-in.
 *
 * The SSR client uses the PKCE flow, so the email link lands here with a
 * `?code=` that must be exchanged for a session server-side (the code verifier
 * lives in a cookie set when the link was requested). We also accept the
 * `?token_hash=&type=` shape some email templates use. On success we set the
 * session cookies and bounce to `next` (default home); on failure, back to
 * /login with an error flag.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  const supabase = await createClient();
  if (supabase) {
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(`${origin}${next}`);
    } else if (tokenHash && type) {
      const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
      if (!error) return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth-callback`);
}
