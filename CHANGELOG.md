# Changelog

The technical record of notable changes, newest first. User-facing highlights
also appear in the in-app Help Center ("what's new"), sourced from
`src/lib/help/content.ts`. Dates are ISO (UTC).

## 2026-06-14

### Added
- The reading (the prose layer over the synthesis) now streams in live, token by
  token, on both `/api/charts/narrate` and the new `/api/synastry/narrate`.
- A resonance reading for the platonic and intimate lenses, written over the
  deterministic comparison and shown under the resonance results.
- Content-addressed narrative cache (`energetics.narratives`, migration
  `0004_narratives.sql`): readings are memoized by a hash of the structure, so
  reopening a chart, or an identical chart, never re-bills the model. Writes are
  server-only via `SUPABASE_SERVICE_ROLE_KEY`. See
  `docs/adr/0005-narrative-streaming-cache.md`.
- Edit a saved chart's birth data (date, time, place). The reading and synthesis
  recompute from the corrected data, with precision and timezone re-derived
  server-side through `intake()`.
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
