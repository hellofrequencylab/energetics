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
| `ANTHROPIC_API_KEY` | narrative | Server only. The reading streams when this is set. |
| `SUPABASE_SERVICE_ROLE_KEY` | narrative cache (optional) | Server only. Lets the server write the narrative cache so readings are reused instead of re-billed. Without it, readings still stream, they just regenerate each time. Never expose in a `NEXT_PUBLIC_` variable. |
| `SE_EPHE_PATH` | higher precision (optional) | Path to `.se1` files. Without it, `sweph` uses the built-in Moshier model, which is fine for a baseline. |
| `NEXT_PUBLIC_SITE_URL` | SEO / sharing (optional) | The canonical origin (e.g. `https://onesky.app`). Used by `sitemap.xml`, `robots.txt`, OpenGraph, and `metadataBase`. Falls back to a default for local and preview builds. |

The compute and AI routes are rate-limited per IP (`src/lib/rate-limit.ts`). The
limiter is in-memory, so on serverless it is per-instance and resets on cold start.
For hard, multi-instance limits, back it with a shared store (for example Upstash
Redis); the call site stays the same.

## First-time activation (Supabase)

This is how OneSky was brought online inside the shared Supabase project. It is
idempotent enough to repeat on a fresh project.

1. **Apply the schema.** Run the migrations in `supabase/migrations/` in order
   (`0001_init.sql` through the latest). `0001` creates the `energetics` schema,
   the core tables, row level security policies, indexes, and grants to the API
   roles; later migrations add profiles, the primary chart, and the narrative
   cache (`0004_narratives.sql`). The `vector` extension lives in `public` and is
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

Two methods, both through Supabase. **Magic link** uses the PKCE flow: the login
page requests a link with `emailRedirectTo = <origin>/auth/callback`. **Email and
password** uses `signInWithPassword` (sign in) and `signUp` (create account); the
password session is set in cookies directly, so no callback is needed for sign in.

Emailed links (magic link, sign-up confirmation, password reset) all return through
`/auth/callback`, which exchanges the code (or verifies the token hash) for a
session, writes cookies onto the redirect, and sends the user on to `next`. Password
reset emails point at `next=/reset-password`, where `updateUser` saves the new
password. If a sign in lands on `/login?error=auth-callback`, the exchange failed:
check the redirect URLs and the Supabase auth logs.

Supabase config: enable the **Email** provider (it covers both password and magic
link). The **"Confirm email"** setting decides sign-up behavior: on, a new password
account must confirm by email before it can sign in (the UI says so); off, sign-up
signs the user in immediately. Add `<origin>/auth/callback` and
`<origin>/reset-password` to the allowed redirect URLs.

## Narrative and its cache

The reading (the prose layer over the synthesis) streams from Anthropic, token by
token, on `/api/charts/narrate` and `/api/synastry/narrate`. It reads the
deterministic synthesis and never computes it.

Each reading is a deterministic function of the structure (model, system prompt,
and the prompt built from the convergences, tensions, or comparison), so it is
memoized in `energetics.narratives`, keyed by a content hash. Reopening a chart,
or two people with identical charts, serves the stored reading instead of calling
the model again.

- Both cache reads and writes happen only server-side with
  `SUPABASE_SERVICE_ROLE_KEY`. The table is not exposed to `anon`/`authenticated`
  (migration `0008` dropped the old world-readable policy), because a reading can
  mention user-entered names (resonance and theme readings). Clients never touch
  the table. Without the service key, readings still stream, they just regenerate
  each time (no caching) and nothing is stored.
- To clear the cache, truncate `energetics.narratives`. Readings regenerate on
  next view. Editing a chart's birth data changes its structure, so it
  content-addresses to a fresh reading automatically.

## Systems catalog and admin

Most systems are registered but offered off by default. The offered set is the
catalog default (`src/lib/core/catalog.ts`) overlaid with admin toggles stored in
`energetics.system_settings`.

- **Who is an admin.** Anyone whose `energetics.profiles.is_admin` is true. There
  is no admin UI for granting admin; set it directly:
  `update energetics.profiles p set is_admin = true from auth.users u where u.id =
  p.user_id and lower(u.email) = '<email>';`. The repo migration does not hardcode
  any email; seed the owner this way after they have signed in once (a profile row
  must exist). A trigger (`guard_profile_is_admin`, migration `0008`) blocks any
  attempt to set or change `is_admin` from a request carrying a user token, so this
  grant must run as the service role or via direct SQL (the SQL editor, where
  `auth.uid()` is null), which is exactly the command above.
- **Switching systems on or off.** Sign in as an admin and open `/admin/systems`.
  Toggles take effect immediately for everyone: compute reads the live effective
  set on every chart path. Writes are admin-only by row level security.
- **Changing the default core.** Edit `CATALOG` in `src/lib/core/catalog.ts` and
  deploy. `inSynthesis` (whether a system feeds the synthesis, e.g. Dreamspell is
  shown but excluded) lives only here, not in the database.
- **To reset a system to its catalog default,** delete its row from
  `energetics.system_settings`.

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
