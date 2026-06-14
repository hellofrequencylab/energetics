# ONESKY

A multi-system birth-chart **synthesis engine**. The sky is computed once as shared
infrastructure; every divinatory system is an isolated interpretive engine that
never sees another engine's output; and a separate, **deterministic** synthesis
layer finds where independent systems *converge* and where they hold *tension* —
never a blended score, always fully attributed.

> Status: **v0.1 — Phase 0 + Phase 1** of the architecture spec. Foundations are
> in place and a real synthesis renders on real data; depth is added per system,
> behind unchanged contracts.

## The one idea

**The sky is computed once. Each system interprets it in isolation. Synthesis
reads only normalized, provenance-tagged primitives and re-computes nothing.**
If a change would violate that sentence, it's wrong.

## Architecture (layers)

```
Presentation (Next.js)        src/app, src/components
Synthesis (deterministic)     src/lib/synthesis  — gather→cluster→weight→tension→rank
Semantic adapters             src/lib/systems/<id>/adapter.ts  (native → ontology primitives)
System engines (pure)         src/lib/systems/<id>/engine.ts   (own math, native output)
Shared core                   src/lib/core       (BirthEvent, contracts, ephemeris, registry)
Ontology                      src/lib/ontology   (axes, crosswalks, oppositions)
```

Data flows **up only**. The registry (`src/lib/core/registry.ts`) is the *only*
place systems are wired together.

### Non-negotiable invariants

1. **Engines are pure** — `compute(birth, {ephemeris})` is deterministic: no I/O,
   randomness, clock, or network.
2. **No engine imports another engine.** The registry wires them.
3. **The ephemeris is a utility**, computed once and shared (`EphemerisService`).
4. **Native math stays native**; mapping to the shared ontology happens in a
   separate, auditable adapter.
5. **No blended score.** Synthesis is a graph of weighted convergences/tensions,
   each fully attributable.
6. **Embeddings never feed structural synthesis.** Hard structure (ontology +
   deterministic code) for the signal; soft language (the optional LLM
   narrative) for prose only.
7. **Provenance is first-class** — every primitive records its source engine and
   what it was derived from; synthesis weights by independence.
8. **Lineage is labeled, not laundered** (`traditional` / `modern-reconstruction`
   / `hybrid`).

## Source-aware synthesis (the honest part)

Convergences are ranked by the count of **independent source groups** that agree,
not by a fabricated decimal. Systems are merged into one independence group when
they share a computational source (`derivedFrom`) or are in each other's
`dependsOn` closure. So two ephemeris-derived systems agreeing counts as **one**
signal in two outfits; an ephemeris system *and* a date-derived system agreeing
is the strong, cross-confirmed theme worth surfacing. Cross-family equivalences
(e.g. Chinese ↔ Western elements) are explicit, confidence-weighted crosswalks —
absence of an edge means "not the same thing".

## Systems

| id | lineage | derivedFrom | status |
|---|---|---|---|
| `western-tropical` | traditional | ephemeris | Sun / Moon / Rising |
| `vedic-jyotish` | traditional | ephemeris | Lagna + Moon (rasi & nakshatra) |
| `chinese-bazi` | traditional | date | animal + Day Master |
| `numerology-pythagorean` | traditional | date | Life Path |
| `tzolkin` | traditional | date | day-sign + galactic tone (GMT 584283) |
| `human-design` | hybrid | ephemeris | scaffold (see engine TODO) |
| `gene-keys` | hybrid | ephemeris | scaffold (`dependsOn` human-design) |

Adding a system = add a folder under `src/lib/systems/<id>` (engine + adapter +
index) and one line in the registry. Nothing else changes.

## Resolved defaults (spec §12)

Whole Sign houses · Lahiri ayanamsa · Tzolk'in GMT 584283 · Swiss Ephemeris
primary (a pure-JS fallback can implement `EphemerisService` later).

## Licensing note

The calculation engine uses the **Swiss Ephemeris** (`sweph`), which is
dual-licensed **AGPL-3.0 or a commercial license** from Astrodienst. For a
commercial product, either comply with the AGPL or obtain a commercial license.
The engine is isolated behind `EphemerisService`, so swapping it is contained.

## Getting started

```bash
npm install
cp .env.example .env.local   # optional: ANTHROPIC_API_KEY for the narrative
npm run dev                  # http://localhost:3000
```

Scripts: `npm run build` · `npm run test` (Vitest) · `npm run typecheck` · `npm run lint`.

### API

- `GET /api/systems` — registry metadata.
- `POST /api/charts/compute` — body: birth intake `{ name?, date, time?, place?: {lat,lng,tz?} }`.
  Returns per-system native output + ontology primitives + the deterministic synthesis.
- `POST /api/charts/narrate` — same body; returns the optional LLM narrative over the synthesis.

### Supabase

`supabase/migrations/0001_init.sql` provisions the schema (birth events, cached
computations, queryable primitives, synthesis snapshots, and corpora with
pgvector for *retrieval only*). The app computes charts without Supabase
configured; set the env vars to enable persistence + auth.

## Testing

Golden engine values, independence-grouping behavior, and a synthesis snapshot
live in `src/**/*.test.ts` (`npm run test`).

## Roadmap (next)

- Human Design BodyGraph (Design chart at −88° solar arc → gates → channels →
  centers → Type/Authority), validated against a published calculator.
- Phase-2 systems + `center`/`domain` axes + crosswalks v1.
- Persist to Supabase (`/api/birth-events`, cache `chart_computations`).
- Interpretation corpora (quick-guide tier, then deep-dive + embeddings).
