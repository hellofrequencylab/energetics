# Changelog

The technical record of notable changes, newest first. User-facing highlights
also appear in the in-app Help Center ("what's new"), sourced from
`src/lib/help/content.ts`. Dates are ISO (UTC).

## 2026-06-25

### Changed
- OneSky's Postgres schema renamed from `energetics` to `onesky`, and OneSky moved
  out of the Frequency project (ref `azsqfeonabsbmemvddqd`) into the hook Apps
  Studio project (ref `qakbtenvporcfkznivdh`) under a schema-per-app isolation
  model (`public` for Hook, `onesky` for OneSky, `resonance` for Resonance later,
  plus a `shared` schema for cross-app commons). Each app's client pins
  `db.schema`, RLS is forced on every table, grants are per-schema, and PostgREST
  exposed schemas controls what is served. Studio apps share one login pool
  (one `auth.users`), so isolation is at the schema and RLS layer. The app codename
  stays "energetics". See `docs/INFRA.md` and ADR-0009.

## 2026-06-15

### Added
- Monetization and AI cost safety (ADR-0008). OneSky is now freemium: the full
  basic chart and reading stay free with no account, and a Plus subscription
  ($8.99/mo or $59.99/yr, 7-day trial) unlocks depth (theme drill-down, unlimited
  resonance, the daily Today page, saving beyond 3 charts, practitioner tools).
  - Entitlement is server-enforced (`src/lib/billing/entitlement.ts`, `is_plus`
    in SQL), never client-trusted. New migration `0010_billing.sql`: `customers`
    (service-role only), `subscriptions` (owner-read), an `ai_usage` ledger, and a
    DB-enforced free cap of 3 saved charts.
  - The three narrate routes share one gate: a per-viewer daily quota (visitor 3,
    anon 5, free 10, Plus 50), drill-down is Plus-only, resonance is 3 free runs
    then Plus, an opt-in global daily budget breaker (`AI_DAILY_BUDGET_USD`), and
    Turnstile (verified when a token is sent). Quota and budget are consumed only
    on a real generation, so cache hits stay free and never count.
  - Anonymous (guest) sign-in: "Continue as guest" on the login form via Supabase
    anonymous sign-ins, gated by Turnstile when configured. Guests get a real user
    id, so the cap and quotas apply and the id (and saved charts) carry over when
    they add an email.
  - Stripe scaffolding (hosted Checkout + Customer Portal + a single
    sync-on-webhook source of truth) ships inert until keys are set; everyone is
    free until then. Routes: `/api/billing/checkout`, `/portal`, `/webhook`. New
    `/plus` page with an honest free-vs-Plus comparison; a Membership card on the
    account page.

### Security
- Full-site review fixes, all enforced at the database layer (migration
  `0008_security_hardening.sql`). Closed an admin privilege-escalation hole: a
  signed-in user could set their own `profiles.is_admin` to true through the public
  API. A trigger now forbids setting or changing `is_admin` from any request
  carrying a user token (only server-side/service-role and direct SQL can grant
  admin). Closed a resonance IDOR: a saved resonance must now reference two charts
  the caller owns (enforced in the RLS with-check and re-checked in the route).
  Closed the narrative cache: a reading can mention names, so the cache table is no
  longer world-readable; the server reads it with the service role.
- Auth redirects are sanitized. The post-sign-in `next` target (which travels in
  magic-link and reset emails) is validated to a same-site path
  (`src/lib/auth/safe-next.ts`), preventing open redirects. The on-demand theme
  reading route now bounds its inputs so it cannot be used as an open model relay.
- API 500s no longer return raw database error messages to clients (which could
  disclose schema or policy detail); they log server-side and return a generic
  message.
- Second review pass. Defense in depth on the account routes: editing or deleting
  a saved chart or resonance now scopes the write to the owner in the query itself
  (`.eq("user_id", ...)`), not RLS alone. The per-IP rate limiter derives the
  client IP from a trusted platform header instead of the leftmost
  `X-Forwarded-For` (which a client can spoof to mint unlimited buckets), and it
  now also covers `/api/search`; `search` and `geocode` bound their query length,
  and the profile display name is capped. The admin-guard trigger function
  `guard_profile_is_admin` is no longer executable as a PostgREST RPC by the API
  roles (migration `0009`).
- Hardening round. A CSRF guard in middleware rejects cross-site, state-changing
  `/api` requests (via `Sec-Fetch-Site`, with an `Origin`-vs-host fallback), as
  defense in depth alongside SameSite cookies. Server errors now go through one
  structured JSON logger (`src/lib/log.ts`), a single choke point for adding an
  error tracker later. The costly AI routes can share a per-IP limit across
  serverless instances via Upstash Redis when `UPSTASH_REDIS_REST_*` are set,
  falling back to the in-memory window otherwise.

### Polish
- Page titles no longer double-brand. Sub-pages now set a bare title and the root
  layout's `%s · OneSky` template appends the suffix once, so a title reads
  `Help · OneSky` instead of `Help · ONESKY · OneSky`, with consistent casing. The
  home page keeps its full brand line via `title.absolute`.
- Per-page canonical URLs on every indexable page (welcome, about, help, glossary,
  resonance, privacy, terms) via `alternates.canonical`, so query strings and the
  `/` redirect consolidate to one URL. The signed-in `/today` page is now
  `noindex`, joining account, admin, reset-password, and the style guide.
- The web app manifest ships raster PNG icons (192 and 512) alongside the scalable
  SVG, plus a dedicated maskable PNG with safe-zone padding so Android's adaptive
  icon mask never crops the convergence mark.
- The landing page ships less JavaScript up front: the reader (`Dashboard`, which
  pulls in the full `SynthesisView`) now loads on demand with `next/dynamic` once a
  reading is produced, rather than in the initial bundle.

### Performance
- The service worker now serves static assets stale-while-revalidate (instant
  from cache, refreshed in the background), so stable assets like icons and fonts
  stay fresh without a hard cache bump. Cache version `onesky-v2`.
- Opening a saved chart now reads the version-keyed native-result cache
  (`chart_computations`) and re-runs only the cheap, pure adapters instead of
  every engine (`src/lib/compute-cache.ts`). Strict all-or-nothing: any missing
  system, corpus/ephemeris version mismatch, or adapter error falls back to a full
  recompute, which then warms the cache. Output is identical (adapters are
  deterministic functions of the stored native result); covered by a unit test.
- Database advisors addressed (migration `0009_perf_and_rls_hardening.sql`):
  covering indexes for every foreign key the linter flagged
  (`birth_events.user_id`, `profiles.primary_chart_id`, both `resonances` chart
  refs, `syntheses.birth_event_id`), and all owner/admin RLS policies rewritten to
  evaluate `auth.uid()` once per query via `(select auth.uid())` instead of once
  per row.

### Accessibility
- Added a "Skip to content" link and a `<main id="main">` landmark on every page,
  including the landing page, which previously had no main landmark at all. Birth
  form errors are now announced to assistive tech (`role="alert"`).
- Account, admin, and password-reset pages are marked `noindex` so they cannot be
  surfaced by search engines.

### Fixed
- Numerology (Pythagorean): the Life Path is now the full digit sum of the date,
  reduced once, so master numbers (11/22/33) are preserved and a master inside the
  month or day no longer leaks into the total. Challenges and pinnacles are built
  from single-digit date parts, so every challenge stays within 0..8 (the Main
  Challenge could previously exceed it for November/Feb-29 births). `corpusVersion`
  bumped to 3; added a unit test.
- Nine Star Ki: births in early January (before 小寒, ~Jan 6) are now placed in the
  prior solar month (大雪) instead of being forced into 小寒, correcting the Monthly
  Star for those dates.
- Synthesis determinism: the cluster representative value and the convergence
  ranking now break ties lexically, so output never depends on system registry
  order.
- Synastry and resonance output is order-independent too: the cross-aspect and
  shared-emphasis sorts break ties deterministically, so the comparison and its
  content-addressed cached reading never depend on iteration order.

### Changed
- Synthesis breadth is now honest per tradition. Independence groups are declared
  explicitly (`src/lib/synthesis/independence.ts`) by the signal a system reads,
  not by the coarse `derivedFrom` class. Correlated families still count once (all
  zodiac systems, all Chinese systems, all numerology), but genuinely distinct
  date traditions (the Maya count, the Chinese cycle, seasonal bands) are now
  independent of each other, so a theme they share can rank above the old
  three-group ceiling. See ADR-0007. The narrative cache self-invalidates (its key
  includes the group count), so no migration is needed.
- The BaZi and Nine Star Ki adapters now self-check every emitted value against the
  registered ontology (`isRegistered`), matching the other adapters.
- Signed-in pages read the session and profile once per request (React `cache()` in
  `src/lib/auth/session.ts`), removing two or three duplicate `profiles` reads per
  page render.

### Added
- A daily-use home at `/today` for signed-in users. It reads the current sky
  against your primary chart: a season strip (Sun sign, Moon sign, Moon phase),
  your natal Sun/Moon/Rising at a glance, today's transits to your chart (tightest
  first, applying vs separating), and quick links to recent charts and resonances.
  Deterministic (no model calls), cache-backed via the saved-chart loader, and
  linked from the header, the signed-in section nav, the footer, and the mobile
  tab bar. When no primary chart is pinned, it invites you to choose one.

### Added
- Production hardening. Route and root error boundaries (`error.tsx`,
  `global-error.tsx`) and a loading state (`loading.tsx`); SEO via `sitemap.ts`,
  `robots.ts`, a default OpenGraph share image (`opengraph-image.tsx`), and
  `metadataBase` + OpenGraph/Twitter metadata (`SITE_URL` from
  `NEXT_PUBLIC_SITE_URL`); a per-IP rate-limit guard (`src/lib/rate-limit.ts`)
  applied to the compute and AI routes (compute/synastry/transits, the narrate
  routes, geocode); and Privacy and Terms pages, linked from the footer.

### Added
- OneSky is now an installable app (PWA). A web app manifest (`app/manifest.ts`),
  a convergence app icon (`public/icon.svg`, plus generated favicon and iOS
  apple-touch-icon via `app/icon.tsx` and `app/apple-icon.tsx`), a theme color and
  standalone display, and a conservative service worker (`public/sw.js`, registered
  by `PwaRegister`) that serves an offline fallback page (`/offline`) when a
  navigation fails. Add to Home Screen installs it and it runs full-screen. Signed-in
  pages gain an app-style bottom tab bar on phones (`MobileTabBar`).

### Added
- More depth for every system in the catalog. Each of the 21 systems now has a real
  engine and adapter (the last scaffolds, Kabbalah Tree of Life, Tibetan astrology,
  and Lo Shu grid numerology, are now built), exposes more native factors, maps more
  of them onto the shared ontology so it forms more cross-system convergences and
  tensions, and has a full reader overview on its detail page. Highlights: Western
  adds sect, triplicity, decan, chart ruler, and chart shape; Vedic adds nakshatra
  lord, dasha lord, atmakaraka, and tatva balance; Hellenistic adds sect, triplicity
  lords, and the Lot of Spirit; Human Design adds profile angle, signature, not-self,
  and open centers; Gene Keys gains the full Hologenetic profile (Activation, Venus,
  Pearl); BaZi adds the Ten Gods, day-master strength, na yin, and a useful element;
  numerology adds pinnacles, challenges, and Chaldean cornerstone/capstone/hidden
  passion; Tzolk'in adds tone phase, direction, and year-bearer; tarot, runes, the
  Celtic tree, and Akan day-names gain elements, polarity, and domains. All ontology
  values stay within the registered vocabulary; engines stay pure.

### Added
- Save and manage resonance comparisons. A new `energetics.resonances` table
  (migration `0007`, owner-scoped RLS) stores a pairing of two saved charts plus the
  lens (platonic or intimate). The comparison page shows a "Save this resonance"
  button when both sides are saved charts, and the account page gains a "Saved
  resonances" section to reopen or remove them. Create, list, and delete queries
  with `/api/resonances` routes; reopening recomputes fresh from the current charts.
  (`db/queries.ts`, `api/resonances/`, `SynastryForm.tsx`, `account/ResonanceRoster.tsx`.)

### Changed
- Chart page details rail, reorganized. The rail now opens with an editable Profile
  card (the person's name and birth chart info, name and birth data edited in one
  place), then at-a-glance, then a Notes card and a Record card (set as My Sky,
  compare, delete), then all convergences and tensions, jump-to-system, and
  provenance. The separate Manage and Birth data cards are gone, merged into Profile
  and Record. (`ChartProfile.tsx`, `ChartRecords.tsx`, `SynthesisView.tsx`;
  `ChartManager.tsx` and `EditBirthData.tsx` removed.)

- The reader is restructured for usability: the convergence chart now spans the full
  width at the top, and everything below splits into two columns: the page content
  (reading, convergences, tensions, transits, the per-system cards) on the left, and
  a details rail on the right (manage and edit on a saved chart, plus at-a-glance
  counts, the strongest themes and central tension, jump-to-system, and provenance).
  (`SynthesisView.tsx`, `account/chart/[id]/page.tsx`.)

### Added
- A calm, on-brand 404 page using the convergence sand mark (`src/app/not-found.tsx`).
- Full accounts: email and password sign in and sign up, alongside the existing
  one-time magic link. The sign-in page has a Password / Magic link toggle and a
  create-account switch; password sign-up respects the project's email-confirmation
  setting (it confirms by email when that is on, otherwise signs in at once). Added
  a password reset (forgot password emails a link through `/auth/callback` to a new
  `/reset-password` page that calls `updateUser`). Profiles are still created lazily
  on first sign-in, so new password accounts get the same onboarding.
  (`auth/LoginForm.tsx`, `auth/ResetPasswordForm.tsx`, `reset-password/`, `login/`.)

### Changed
- One header and footer on every page, driven by a single role-based menu config
  (`src/components/site/nav.ts`). The splash now uses the shared `SiteHeader`
  instead of its own, so navigation is identical site-wide. Menus adapt to role:
  everyone sees the product links; admins also get an Admin link; the header action
  is Sign in (signed out) or Account (signed in); the footer account column shows
  Sign in, or Your charts plus Admin and Sign out. The role is read once in
  `SiteShell` and shared with both. The header is non-sticky on mobile (scrolls
  away), sticky on larger screens. (`SiteHeader.tsx`, `SiteFooter.tsx`,
  `SiteShell.tsx`, `nav.ts`, `role.ts`, `welcome/page.tsx`.)
- The remaining content pages (about, help, glossary) now use the design system:
  the uniform width, `PageHeader`, `Card`, and `Badge`, with semantic tokens. The
  whole site (splash aside) is now on one framework. (`about/`, `help/`, `glossary/`.)
- Convergence map: the opening layout is less crowded. Theme points now keep more
  space between each other and a clear gap around the center, so the self node and
  its label are never overlapped. (`ConvergenceChart.tsx`, the `relax` pass.)

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
