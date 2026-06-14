# Changelog

The technical record of notable changes, newest first. User-facing highlights
also appear in the in-app Help Center ("what's new"), sourced from
`src/lib/help/content.ts`. Dates are ISO (UTC).

## 2026-06-14

### Added
- The Convergence Chart: an interactive flagship visual in the reader. Systems
  ring the edge colored by their independence group, convergences pull toward the
  center in proportion to how many groups agree, tensions arc between poles, and
  every point opens a details popover (`src/components/ConvergenceChart.tsx`).
- A standardized site header (wordmark, navigation, auth-aware action) and a
  comprehensive footer (`src/components/site/`), applied across every page through
  a shared `SiteShell`.
- A per-system detail page (`/account/chart/[id]/system/[systemId]`): the person,
  the system and its lineage, their details within it, the system drawn in its
  traditional form, and the crossover connections to other systems (shared
  convergences and complementary tensions). Linked from each system in the reader.
- Per-system diagrams: each tradition now renders in its own traditional form from
  the computed data, in the reader's per-system cards. Human Design draws the
  bodygraph (defined centers and channels), BaZi the four pillars, the Maya count
  a kin with an authentic bar-and-dot tone, Dreamspell the galactic signature,
  Tarot the birth cards, and Pythagorean numerology the life-path medallion.
  Western keeps its chart wheel. Artwork is original and schematic, never a
  reproduction of a published deck or carved glyph. (`src/components/diagrams/`.)
  The Human Design engine now exposes its defined `channels`, and the BaZi engine
  its full four `pillars`, as native display data (no synthesis change).
- Systems catalog with a live admin (`/admin/systems`, gated by `profiles.is_admin`).
  Most systems are now registered but off by default; the core set (Western
  tropical, Human Design, Pythagorean numerology, Maya Tzolk'in, Chinese BaZi,
  Tarot birth cards) is on, with Dreamspell shown but kept out of the synthesis.
  Toggles persist in `energetics.system_settings` (migration `0005`) and gate every
  chart-computing path via `effectiveEnabledIds()`. Governance lives in
  `src/lib/core/catalog.ts`. See `docs/adr/0006-systems-catalog-and-admin.md`.
- Three new registered scaffolds (off by default): Kabbalah Tree of Life (gematria),
  Tibetan astrology, and Lo Shu grid numerology. Registry is now 21 systems.
- The AI reading auto-writes itself in chart outputs (single chart and resonance),
  no longer waiting for a click. `NarrativePanel` gained `autoStart`.
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
- The reader's prose now renders `**bold**` and `*italic*` as emphasis instead of
  showing the literal asterisks.
- Chart compute on Vercel returned an HTML error instead of JSON. The native
  `sweph` binary is now force-included in serverless functions via
  `outputFileTracingIncludes`. See `docs/adr/0004-bundle-sweph-prebuilds.md`.
- Magic-link sign in did not establish a session, because the link redirected to
  a route that did not exchange the code. See
  `docs/adr/0003-pkce-magic-link-callback.md`.

### Changed
- The reader's per-system blocks are now a consistent dashboard: the chart drawing
  on the left, the energy cheat sheet on the right, how it applies and things to
  note underneath, and a row of shared convergences whose chips jump to the
  related system on the page. A jump nav at the top moves between systems
  (`src/components/SystemCard.tsx`, `src/lib/system-labels.ts`).
- Reworked the home page copy and structure end to end: a clearer hero that names
  the traditions and the convergence idea, a sharper "how it works", a new "what
  you get" benefits section, a credibility note (Swiss Ephemeris), and stronger,
  more readable copy throughout.
- The Convergence Chart now reads clearly: cross-confirmed themes are labeled and
  pulled toward the center by agreement, single-lens noise is dropped from the
  visual, system names are shortened, and a plain takeaway under the chart names
  your strongest themes and central tension. Every section gained a description of
  what it tells you about your energy, and each system block now shows an "energy
  at a glance" cheat sheet (`src/lib/cheatsheet.ts`).
- Reader overhaul: larger, more readable type throughout; the chart wheel moved
  into the Western (Tropical) system card; each system block now carries a plain
  explanation; and a written reading is saved to the chart and shown at once, with
  a Refresh control, instead of being rewritten on every visit.
- Warmer, more readable styling: warmer dark background and surfaces, higher-
  contrast body and secondary text, a comfortable base type scale, and balanced
  headings. A single app background now sits under every page.
- Public surfaces (welcome, help, about, `/api/systems`) list the offered set
  (`offeredMeta()`) rather than the whole registry, so off systems are not
  advertised. Compute uses the live effective set.
- Chart editing is now a clearly labeled Birth data card with an Edit button, plus
  Edit links from the account roster and My Sky (deep-linking to `#edit`).
- The app now targets the isolated `energetics` Postgres schema on Supabase via a
  shared `DB_SCHEMA` constant. See
  `docs/adr/0002-isolated-energetics-schema.md`.
- Rebranded the product to OneSky (wordmark: ONESKY) across user-facing surfaces.
