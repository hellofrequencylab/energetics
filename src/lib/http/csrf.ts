/**
 * CSRF defense for cookie-authenticated, state-changing API requests.
 *
 * Supabase auth rides in cookies, so a cross-site form/fetch could otherwise ride
 * the user's session. We reject any mutating /api request that a browser marks as
 * cross-site. The primary signal is `Sec-Fetch-Site` (set by the browser, not
 * forgeable by page script); we fall back to comparing `Origin` to the request
 * host. Requests with NO browser signal at all (e.g. server-to-server, curl) are
 * allowed through — they carry no ambient cookie to abuse — so this never breaks
 * non-browser clients.
 */
const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function isCrossSiteMutation(request: Request): boolean {
  if (!MUTATING.has(request.method.toUpperCase())) return false;

  const secFetchSite = request.headers.get("sec-fetch-site");
  if (secFetchSite) {
    // same-origin / same-site / none are fine; only cross-site is blocked.
    return secFetchSite === "cross-site";
  }

  // Older browsers: compare the Origin host to the request host.
  const origin = request.headers.get("origin");
  if (!origin) return false; // no browser signal at all — not a CSRF vector
  const host = request.headers.get("host");
  try {
    return new URL(origin).host !== host;
  } catch {
    return true; // malformed Origin — treat as cross-site
  }
}
