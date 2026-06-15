# Changelog

The technical record of notable changes, newest first. User-facing highlights
also appear in the in-app Help Center ("what's new"), sourced from
`src/lib/help/content.ts`. Dates are ISO (UTC).

## 2026-06-15

### Added
- Full accounts: email and password sign in and sign up, alongside the existing
  one-time magic link. The sign-in page has a Password / Magic link toggle and a
  create-account switch; password sign-up respects the project's email-confirmation
  setting (it confirms by email when that is on, otherwise signs in at once). Added
  a password reset (forgot password emails a link through `/auth/callback` to a new
  `/reset-password` page that calls `updateUser`). Profiles are still created lazily
  on first sign-in, so new password accounts get the same onboarding.
  (`auth/LoginForm.tsx`, `auth/ResetPasswordForm.tsx`, `reset-password/`, `login/`.)

### Fixed
- Convergence map: raising "min connections" no longer breaks tensions. Tension
  poles are now exempt from the connection filter, so a tension whose pole is also
  a strong theme (for example Active or Fire) is never half-hidden, and no pole is
  left as a lonely dot with no line. The filter still thins the strength web.
  (`ConvergenceChart.tsx`, covered by `ConvergenceChart.test.tsx`.)
  role-aware section nav passed a function prop from a server component to a client
  component, which is not allowed and threw at request time. The nav item now uses
  a serializable `activePrefix` string instead. (`SectionNav.tsx`, `AppSectionNav.tsx`.)

### Changed
- Birth form on mobile: the reading button now sits directly under the fields, with
  the "Your profile" preview below it (responsive `order`; desktop layout
  unchanged). (`BirthForm.tsx`.)
- Welcome page on mobile: the header is no longer sticky, so it scrolls away as you
  reach the form and the form gets the whole screen, and the form lands at the top
  without clipping. The fixed bottom call-to-action bar is removed. This replaces
  the earlier `intake-focus` chrome-hiding approach, which shifted the layout and
  clipped the top of the form. (`WelcomeShell.tsx`, `welcome/page.tsx`, `globals.css`.)

## 2026-06-14

### Fixed
- Welcome page on mobile: when the birth form locks into view, the competing chrome
  (the welcome header and the bottom call-to-action bar) now hides and the form
  becomes a focused, full-height panel, so only the form fills the screen. The form
  also snaps to the top of the screen instead of the center. (`WelcomeShell.tsx`,
  `welcome/page.tsx`, and the `intake-focus` rule in `globals.css`.)

### Added
- A real design system (foundation). New UI primitives in `src/components/ui/`
  (`Container`/`PageHeader`, `Button`, `Card`, `Badge`, `Field`/`Input`/`Textarea`/
  `Select`/`Toggle`, `EmptyState`, `Divider`, `SandMark`, `SectionNav`), one
  classname helper (`src/lib/ui/cn.ts`), and shared SVG colors
  (`src/lib/design/colors.ts`, now used by the convergence map, strength bars, and
  arcs instead of three duplicated copies). A living reference renders at
  `/styleguide`, and the framework is documented in `docs/DESIGN-SYSTEM.md`.
- One uniform container width across the whole site, defined once in `CONTAINER`
  (`src/components/ui/Container.tsx`). The header, footer, and every page now align
  to it. (The legacy `SiteShell width` prop is accepted but ignored.)
- A role-aware section sub-nav for the signed-in area (`AppSectionNav` +
  `SectionNav`): Charts and Resonance for everyone signed in, with Admin added for
  admins, and hidden when signed out. Admin is now reachable from a real nav, not
  only a conditional account card.

### Changed
- Reworked the account and admin areas onto the design system: the dashboard,
  saved-chart page, per-system page, chart manager, birth-data editor, account
  controls, the systems-catalog admin, and the resonance page now use `PageHeader`,
  `Card`, `Button`, `Field`, `Badge`, `Toggle`, and `EmptyState`, with consistent
  spacing, one eyebrow color, one button language, and semantic color tokens
  (`foreground`/`muted`/`border`/`surface`) instead of ad-hoc per-page styles.

### Changed
- Convergence map: single-source tension poles are now first-class theme nodes on
  the map, not separate floating "ghost" points. Each one is drawn near, and
  threaded to, the system that holds it, and is draggable like any theme; the
  tension line between two poles follows as either end moves. This replaces the
  earlier ghost-pole approach (poles that floated at the ring, read as
  disconnected, and could not be repositioned). Every tension is now a line
  between two grounded, draggable nodes. Single-source theme dots are tinted
  violet to match the tension they anchor; the connections filter never hides a
  tension pole. (`ConvergenceChart.tsx`.)

### Fixed
- Convergence map: tensions whose poles are both single-source (for example
  air vs earth when one tradition holds both) drew as a stray dot or a tiny line,
  because both poles piled onto the same system and the spread scattered them. Now
  every tension that involves a non-convergence pole gets its own angular slot out
  near the ring: a two-pole-ghost tension is a clear chord, a one-ghost tension runs
  from its central convergence out to the edge. Ghost poles are now fixed (not
  draggable), so they no longer feel like loose, unconnected dots; the convergence
  ends stay draggable and their lines follow. Covered by `ConvergenceChart.test.tsx`
  (every tension draws a line longer than a threshold). (`ConvergenceChart.tsx`.)

### Changed
- Convergence map: cleaner tensions. Single-source tension poles (the small violet
  "ghost" points) now sit out near the systems that hold them, clear of the central
  themes, so each tension line reads as a clean diagonal instead of piling up in the
  middle. The "⟷" marker now appears only when you hover or select a tension, rather
  than sitting on every line. Both ends of every tension stay draggable and the line
  follows, now covered by component tests (`ConvergenceChart.test.tsx`, run under
  `npm run test` via a happy-dom docblock). (`ConvergenceChart.tsx`.)

### Added
- Convergence map: a "min connections" control. A slider sets how many points a
  theme must connect (its threads to systems) before it shows, from 2 up to the
  most any theme reaches in this chart, so a reader can thin a busy map down to
  the most-connected themes. The current threshold and the count shown are
  displayed beside it. (`ConvergenceChart.tsx`.)

### Changed
- Convergence map: tension lines now stick to their endpoints when dragged. Both
  the theme dots and the ghost tension poles are draggable through a single
  position store keyed by theme, so dragging either end moves the dashed tension
  line with it. (`ConvergenceChart.tsx`.)

### Added
- Per-system depth (batch one, the offered systems). Each system now has an
  in-depth overview (`src/lib/systems/<id>/overview.ts`, collected in
  `src/lib/system-overviews.ts`): what it is, how to read your result, how it
  applies to your life, a lineage-honest note, and a plain meaning for each of
  your stats. The per-system detail page renders all of it. Engines expose more
  derived info (for example Western element/modality/polarity balance, BaZi
  element balance, Pythagorean birthday/attitude/maturity/challenge numbers,
  Chaldean soul-urge and personality numbers, a Tarot teacher card), and adapters
  emit more ontology primitives so more systems form connections.

### Fixed
- Convergence map: every tension now draws, not just the ones whose both poles are
  cross-confirmed convergences. A pole that is a convergence stays a draggable
  point; a pole that is not gets a "ghost pole" placed near the systems that hold
  it (a small violet marker), spread clear of the other points so nothing piles on
  the center. The earlier fix avoided the center-cluster by hiding those tensions
  entirely, which dropped most of them from the map. (`ConvergenceChart.tsx`.)

### Changed
- The convergence map now shows only true convergences (themes two or more
  independent groups reached); single-source values stay in the system cards
  below. Points are guaranteed to start fully spread out, with no overlap.
- More systems now take part in the synthesis: Norse runes, the Celtic tree
  calendar, and Gene Keys gained real adapters that map their values onto the
  shared themes, so they form visible connections (Gene Keys shares Human
  Design's independence group, so it adds threads without inflating the count).

### Added
- Name numerology (Chaldean) is now offered by default. It reads the numbers in the
  letters of your full name, forming an independent "name" voice in the synthesis.
  The birth and resonance forms ask for your full name with a plain explanation of
  why and a privacy note; without a name, the card invites you to add one. A name
  number medallion shows in the system card. (`numerology-chaldean` in the catalog.)

### Added (Convergence Explorer)
- The Convergence Explorer: the chart became a small, empowerment-framed dashboard.
  - Four views: the map, ranked Strengths bars, system Arcs (co-occurrence), and an
    accessible Table that doubles as the screen-reader fallback.
  - A lens toggle (Everything / Strengths / Tensions) and source-group filters
    (Sky / Calendar / Name).
  - Draggable theme points with the layout remembered per chart, a Reset, and a
    Save image (PNG) button.
  - The Quick info panel now names the strength and the growth edge for each theme
    (`src/lib/convergence-meaning.ts`), and a "Tell me more" button streams a
    grounded reading of a single theme on demand
    (`/api/themes/narrate`, translate-not-compute).
  - New components under `src/components/chart/` (StrengthsBar, ArcView,
    ChartDataTable) and a PNG export util (`src/lib/svg-export.ts`).
- Convergence chart, round two: it now plots every theme (not only the
  cross-confirmed ones), tension lines connect the two themes that pull apart and
  follow them as you drag, tensions can be toggled on or off, the system dots no
  longer open a graphic, and clicking a theme or tension explains how it tends to
  show up in life (`src/lib/convergence-meaning.ts`).
- The convergence chart is now fully interactive and laid out side by side with a
  Quick info panel. Themes spread out so they are all visible and can be dragged
  to reposition; hovering any point shows a tooltip; clicking a theme or tension
  opens its summary in the panel; clicking a system dot shows that system's chart
  drawing and stats. (`src/components/ConvergenceChart.tsx`.)

### Added
- Drag-and-drop reordering of the systems catalog in the admin (`/admin/systems`):
  drag a row by its handle, or use the up/down arrows, to set the order systems
  appear in everywhere. The order persists per system in `system_settings`
  (migration `0006`; `enabled` is now nullable so a row can carry order without
  forcing an on/off override) and is applied to the reader's system cards and the
  convergence chart, while synthesis and the narration cache key stay on the
  stable registry order. See `src/components/admin/SystemCatalog.tsx`.

### Added (earlier today)
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
- The "energy at a glance" cheat sheets are now fuller and more detailed, sized to
  fill each card: Western shows element balance, rising, and every placement
  (luminaries with a deeper read); BaZi shows the day master, pillar element
  balance, and year animal; Human Design shows type, strategy, authority, profile,
  definition, and defined centers; numerology, Tzolk'in, Tarot, and Dreamspell
  each gain extra lines (`src/lib/cheatsheet.ts`).
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
