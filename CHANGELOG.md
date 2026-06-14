# Changelog

The technical record of notable changes, newest first. User-facing highlights
also appear in the in-app Help Center ("what's new"), sourced from
`src/lib/help/content.ts`. Dates are ISO (UTC).

## 2026-06-14

### Added
- In-app Help Center at `/help`: user guide, registry-driven systems reference,
  FAQ with structured data, and a "what's new" feed.
- Documentation set: `docs/RUNBOOK.md`, `docs/DESIGN.md`, `docs/adr/` (ADRs
  0001 to 0004), `docs/README.md`, `CONTRIBUTING.md`, and this changelog.
- `/auth/callback` route to complete PKCE magic-link sign in.

### Fixed
- Chart compute on Vercel returned an HTML error instead of JSON. The native
  `sweph` binary is now force-included in serverless functions via
  `outputFileTracingIncludes`. See `docs/adr/0004-bundle-sweph-prebuilds.md`.
- Magic-link sign in did not establish a session, because the link redirected to
  a route that did not exchange the code. See
  `docs/adr/0003-pkce-magic-link-callback.md`.

### Changed
- The app now targets the isolated `energetics` Postgres schema on Supabase via a
  shared `DB_SCHEMA` constant. See
  `docs/adr/0002-isolated-energetics-schema.md`.
- Rebranded the product to OneSky (wordmark: ONESKY) across user-facing surfaces.
