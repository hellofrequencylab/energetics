# 0003. PKCE magic-link sign in with a server callback

Status: Accepted

## Context

OneSky uses the Supabase SSR client, which signs in over the PKCE flow. The magic
link returns with a `?code=` that has to be exchanged for a session on the server
(the code verifier lives in a cookie). The first version redirected the link to
`/` with no handler, so the code was never exchanged and the session never stuck.

## Decision

- Add a `/auth/callback` route handler that exchanges the `?code=` for a session
  (and falls back to `verifyOtp` for the `?token_hash=` shape), sets cookies, and
  redirects home. On failure it redirects to `/login?error=auth-callback`.
- Point the login request at `<origin>/auth/callback`.
- Add the OneSky origins to the Supabase Redirect URLs allow list.

## Consequences

- Magic-link sign in completes reliably and matches the callback pattern the
  shared project already uses.
- Auth works on preview deploys too, given the preview origin is allow listed.
