# Runbook

How to configure, deploy, and operate OneSky. Written for whoever is on call,
including future us. Keep it current: if you change how the app is configured or
deployed, update this file in the same pull request.

## Topology

- **App**: Next.js (App Router) on Vercel. Production deploys from `main`.
- **Database and auth**: Supabase. OneSky lives in its own isolated `energetics`
  Postgres schema inside a shared project, so it never touches other apps' tables.
- **Astronomy**: Swiss Ephemeris via the native `sweph` package, Node runtime only.
- **Narrative**: Anthropic API (optional prose layer over the deterministic synthesis).
- **Geocoding**: Open-Meteo (no key).

## Environment variables

Set these in Vercel (Production and Preview). The app degrades gracefully when a
variable is absent: chart computation always works; auth and persistence switch
on only when Supabase is configured; the narrative switches on only with a key.

| Name | Required for | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | auth, saved charts | `https://<project-ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | auth, saved charts | Publishable key (browser safe). Never use the secret key here. |
| `ANTHROPIC_API_KEY` | narrative | Server only. |
| `SE_EPHE_PATH` | higher precision (optional) | Path to `.se1` files. Without it, `sweph` uses the built-in Moshier model, which is fine for a baseline. |

## First-time activation (Supabase)

This is how OneSky was brought online inside the shared Supabase project. It is
idempotent enough to repeat on a fresh project.

1. **Apply the schema.** Run `supabase/migrations/0001_init.sql`. It creates the
   `energetics` schema, the five tables, row level security policies, indexes,
   and grants to the API roles. The `vector` extension lives in `public` and is
   referenced as `public.vector`.
2. **Expose the schema to the Data API.** Supabase dashboard, Settings, Data API,
   Exposed schemas: add `energetics` alongside `public`. Without this, the app
   connects but every table read returns a 404 from PostgREST. Do this in the
   dashboard rather than by SQL, so you do not clobber the shared project's
   PostgREST config.
3. **Set the Vercel environment variables** above and redeploy.
4. **Configure auth redirect URLs.** Supabase dashboard, Authentication, URL
   Configuration. Leave the shared Site URL as it is. Add the OneSky origins to
   Redirect URLs:
   - `https://<your-domain>/**`
   - `https://<preview-pattern>-*.vercel.app/**` (optional, for preview deploys)
   The app requests its own redirect (`/auth/callback`), so it does not depend on
   the project Site URL.

## Auth flow

Magic-link sign in uses the PKCE flow. The login page requests a link with
`emailRedirectTo = <origin>/auth/callback`. The `/auth/callback` route exchanges
the code for a session, sets cookies, and redirects home. If a sign in lands on
`/login?error=auth-callback`, the exchange failed: check the redirect URLs and
the Supabase auth logs.

## Deploy

1. Open a pull request. Vercel builds a preview and posts the URL.
2. Merge to `main`. Vercel builds and promotes production.
3. The branch stays in sync with `main` after each merge.

## Common issues

- **Compute returns "Unexpected token '<' ... is not valid JSON".** The
  `/api/charts/compute` function crashed at module load and returned an HTML
  error page. The usual cause is the native `sweph` binary missing from the
  serverless bundle. We force-include it with `outputFileTracingIncludes` in
  `next.config.ts`. Verify the prebuilds appear in the route's `.nft.json` trace
  after a build.
- **Table reads 404 over the API.** The `energetics` schema is not in Exposed
  schemas. See activation step 2.
- **Magic link does nothing.** The origin is not in Redirect URLs, or the build
  predates the env vars. Add the URL, redeploy, try again.
- **No email arrives.** Check spam. Supabase's built-in email is rate limited on
  the free tier. Wire a real provider (Resend) before onboarding real users.

## Health checks

- `npm run typecheck`, `npm run lint`, `npm run test` gate every change.
- After a deploy: load `/`, compute a chart, then sign in and save one. Confirm a
  row appears in `energetics.birth_events`.
