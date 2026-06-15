/**
 * Cloudflare Turnstile verification for the public narrate routes (ADR-0008).
 * Invisible, privacy-respecting bot protection in front of the costly LLM calls,
 * so an unauthenticated endpoint cannot be scripted into runaway spend.
 *
 * Active only when `TURNSTILE_SECRET_KEY` is set: with no key we fail open (the
 * per-IP burst limit and per-viewer quota still apply), so the app runs before
 * the operator configures Turnstile. The client widget reads
 * `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and sends its token as `x-turnstile-token`.
 */

/** True if Turnstile is configured and should be enforced. */
export function turnstileEnabled(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY);
}

/**
 * Verify a Turnstile token with Cloudflare. Returns true when verification
 * passes, when Turnstile is not configured (fail open), or when Cloudflare is
 * unreachable (fail open, so an outage never blocks legitimate readers). Returns
 * false only when Turnstile is configured and the token is missing or rejected.
 */
export async function verifyTurnstile(token: string | null, ip?: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;
  try {
    const form = new URLSearchParams({ secret, response: token });
    if (ip) form.set("remoteip", ip);
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: form,
      cache: "no-store",
    });
    if (!res.ok) return true; // Cloudflare problem: do not punish the reader.
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return true;
  }
}
