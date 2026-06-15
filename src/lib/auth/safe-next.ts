/**
 * Sanitize a post-auth "next" redirect target so it can only ever point back
 * into this site. An attacker who controls `next` (it rides in magic-link and
 * reset emails, and in the login URL) must not be able to bounce a freshly
 * signed-in user off to another origin.
 *
 * The only safe shape is a root-relative path: a single leading "/" followed by
 * something other than "/" or "\". That rejects the classic open-redirect
 * payloads ("//evil.com", "/\evil.com", and any "scheme:" or protocol-relative
 * URL), which some browsers and runtimes normalize to an off-site destination.
 * Anything else falls back to the account page.
 */
export function safeNextPath(next: string | null | undefined, fallback = "/account"): string {
  if (!next || !/^\/(?![/\\])/.test(next)) return fallback;
  return next;
}
