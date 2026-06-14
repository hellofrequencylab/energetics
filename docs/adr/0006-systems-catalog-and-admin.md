# 0006. A systems catalog with a live admin, most systems off by default

Status: Accepted

## Context

The registry holds many systems, and most are built and correct. But offering all
of them at once makes the reading noisy and puts unvalidated or niche traditions
in front of every user. We wanted to ship a focused core, keep the rest registered
and ready, and switch any of them on over time without a deploy.

The architecture rule still holds: the registry is the only coupling point, engines
stay pure, and the synthesis is deterministic. Governance (what is offered) is a
separate concern from computation (how a system runs).

## Decision

**A catalog, separate from `SystemMeta`.** `src/lib/core/catalog.ts` records, per
system, `defaultEnabled`, `inSynthesis`, and a `group` (core or extended). This is
product governance and is kept apart from `SystemMeta` (the computational contract)
and the registry (the wiring).

- Core, on by default, in the synthesis: Western tropical, Human Design,
  Pythagorean numerology, Maya Tzolk'in, Chinese BaZi, Tarot birth cards.
- Dreamspell is on (shown alongside the Maya count) but `inSynthesis: false`.
- Everything else is registered and off by default, including three new scaffolds:
  Kabbalah Tree of Life (gematria), Tibetan astrology, and Lo Shu grid numerology.

**A live admin, gated by a profile flag.** `profiles.is_admin` gates `/admin/systems`,
where an admin switches systems on or off for everyone. Toggles persist in
`energetics.system_settings` (a per-system `enabled` override). Row level security
limits writes to admins; the table is world-readable so compute can resolve the
offered set for anyone, including signed-out visitors.

**Effective set drives compute.** `effectiveEnabledIds()` overlays the admin
overrides on the catalog defaults. Every product path that computes a chart
(`/api/charts/compute`, `/api/charts/narrate`, `/api/synastry`,
`/api/synastry/narrate`, and the saved-chart page) passes that set to
`computeChart(birth, { only })`, so an off system never runs or appears.

**`inSynthesis` stays in code, not the DB.** Whether a system feeds the synthesis
is a fixed design rule, so `synthesize()` filters by the static catalog and remains
a pure function. The admin toggles only on/off.

**Draconic, harmonic, evolutionary** are noted as planned modes of the Western
chart, not standalone systems, so they are not registered engines.

## Consequences

- `computeChart` gained an optional `only` set. Without it, every satisfiable
  engine runs, so tests and internal tooling are unchanged; product callers pass
  the effective set.
- Public surfaces (welcome, help, about, `/api/systems`) list `offeredMeta()`, the
  catalog defaults. They reflect defaults, not live admin overrides, which is fine
  for marketing and help copy; compute always uses the live effective set.
- Turning a system on is a toggle, not a deploy. Turning the core into something
  different is a catalog edit (code), which is the right place for a durable change.
- One more migration (`0005_systems_catalog.sql`): `profiles.is_admin` plus
  `system_settings`. The owner is seeded as admin out of band, so no email lives
  in the repo.
