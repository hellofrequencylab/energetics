# Systems Plan & Roadmap

The full divinatory-system registry for the synthesis engine, the foundations
that are in place, and the per-system build plan. This is the living source of
truth for *what exists and what's next*; `CORE_ARCHITECTURE.md` governs *how*.

Status legend: **✅ built** (real engine + adapter, emits primitives) · **🟡
spec'd** (detailed system spec received, ready to deep-build) · **⬜ scaffold**
(registered, correct metadata, returns `{}` until built).

## Registry (18 systems)

| id | status | lineage | time | place | source | dependsOn | phase |
|---|---|---|---|---|---|---|---|
| `western-tropical` | ✅ / 🟡 | traditional | ✓\* | ✓\* | ephemeris | — | 1 |
| `vedic-jyotish` | ✅ | traditional | ✓ | ✓ | ephemeris | — | 2 |
| `hellenistic` | ⬜ | traditional | ✓ | ✓ | ephemeris | western-tropical | 3 |
| `chinese-bazi` | ✅ | traditional | ✓ | — | date | — | 2 |
| `zi-wei-dou-shu` | ⬜ | traditional | ✓ | — | date | — | 3 |
| `tzolkin` | ✅ / 🟡 | traditional | — | — | date | — | 1 |
| `dreamspell` | ⬜ / 🟡 | modern-reconstruction | — | — | date | — | 3 |
| `human-design` | ⬜ / 🟡 | hybrid | ✓ | ✓ | ephemeris | — | 1 |
| `gene-keys` | ⬜ | hybrid | ✓ | ✓ | ephemeris | human-design | 2 |
| `numerology-pythagorean` | ✅ | traditional | — | — | date | — | 1 |
| `numerology-chaldean` | ⬜ | traditional | — | — | name | — | 2 |
| `tarot-birth-cards` | ⬜ | hybrid | — | — | date | numerology-pythagorean | 2 |
| `nine-star-ki` | ⬜ | traditional | — | — | date | — | 3 |
| `celtic-tree` | ⬜ | modern-reconstruction | — | — | date | — | 3 |
| `mahabote` | ⬜ | traditional | — | — | date | — | 3 |
| `akan-day-names` | ⬜ | traditional | — | — | date | — | 3 |
| `norse-runes` | ⬜ | modern-reconstruction | — | — | date | — | 3 |
| `egyptian-decans` | ⬜ | traditional | — | — | ephemeris | — | 3 |

\* `western-tropical` currently requires time+place (minimal Sun/Moon/Rising).
Its full spec changes this to **`requires: {time:false, place:false}`** with
graceful precision tiering — see deep-build notes.

**Independence groups** (how synthesis counts sources): `ephemeris` =
{western-tropical, vedic-jyotish, hellenistic, human-design, gene-keys,
egyptian-decans} → counts as **one** voice. `date` = {chinese-bazi,
zi-wei-dou-shu, tzolkin, dreamspell, numerology-pythagorean, tarot-birth-cards,
nine-star-ki, celtic-tree, mahabote, akan-day-names, norse-runes} → **one**
voice. `name` = {numerology-chaldean} → **one** voice. Hard `dependsOn` pairs
(hellenistic→western, gene-keys→human-design, tarot→numerology) are collapsed
within their group so a derived system never double-counts its parent.

## Foundations (status)

- ✅ Core contracts (`SystemEngine` pure, `SemanticAdapter` separate, `Primitive`
  with provenance) — `src/lib/core/contracts.ts`
- ✅ `BirthEvent` intake + derived precision + tz resolution — `src/lib/core/birth-event.ts`
- ✅ Shared `EphemerisService` (Swiss Ephemeris; Chiron resolves optionally) —
  `src/lib/core/ephemeris/`
- ✅ Registry — the single coupling point; all 18 wired — `src/lib/core/registry.ts`
- ✅ Ontology v1 — axes `element` (namespaced), `polarity`, `theme`, `center`
  (9 HD centers), `domain` (12 houses); crosswalks; oppositions — `src/lib/ontology/`
- ✅ Deterministic synthesis — gather→cluster→weight(independence)→tension→rank —
  `src/lib/synthesis/`
- ✅ Optional LLM narrative (reads synthesis, never computes it) — `src/lib/synthesis/narrative.ts`
- ✅ API: `/api/systems`, `/api/charts/compute`, `/api/charts/narrate`
- ✅ DB schema (pgvector for retrieval only) + RLS — `supabase/migrations/0001_init.sql`
- ✅ Tests: engine golden, independence grouping, synthesis snapshot
- ✅ **Persistence path** — `/api/birth-events` (+ GET list); compute caches
  `chart_computations` + `system_primitives` + `syntheses` best-effort for
  signed-in users (`src/lib/db/queries.ts`). Activates when Supabase is configured.
- ✅ **Auth** — Supabase magic-link sign-in (`/login`), session-refresh middleware,
  `getUser()` server helper, sign-out. No-ops gracefully without env.
- ✅ **Geocoding** — place search → lat/lng/tz via Open-Meteo (`/api/geocode` +
  form search). ⚠️ Needs `geocoding-api.open-meteo.com` on the egress allowlist
  (works on Vercel; falls back to presets/manual otherwise).
- ⬜ **Shared presentation** — chart wheel (SVG), bodygraph, aspect grid, ethics panel

## Deep-build notes (specs received)

### `western-tropical` 🟡 (flagship; primary ephemeris consumer)
- **Change meta to `requires:{time:false, place:false}`** + precision tiering:
  `date` → planetary signs (flag Moon cusp); `date-time` → degrees, lunar phase,
  aspects; `date-time-place` → Asc/MC/houses + house placements.
- 12 bodies: Sun…Pluto, North Node, Chiron. Whole Sign default; Placidus config
  with polar fallback (lat > ~66° → Whole Sign).
- Adapter: body weights (Sun/Moon/Asc 0.90; personal 0.60; social 0.45;
  node/Chiron 0.40; **generational Uranus/Neptune/Pluto 0.20 — hard damping**).
  element (western:* = reference family) + polarity + themes + house→domain.
  Aspects are NOT cross-system primitives. No `ONTOLOGY_VERSION` bump needed.
- Golden: 4 cardinal equinox/solstice Sun positions + a Swiss-Ephemeris-validated
  full chart + a retrograde window + precision-degradation tiers.

### `tzolkin` + `dreamspell` 🟡 (Maya — verified engine provided)
- Drop in the verified calendrical core (12/12 self-test): GMT 584283,
  1-Imix-start kin, Long Count, Haab', Lords of the Night (G1–G9), trecena,
  Yucatec+K'iche' names. Tests = the anchor assertions (creation, 2012, 2009).
- `tzolkin` = canonical traditional count (already ✅ minimal; upgrade to full).
- `dreamspell` = modern-reconstruction; engine emits signature + Fifth-Force
  Oracle but **adapter emits no primitives** (informational, excluded from
  structural synthesis — never conflate with the living tradition).

### `human-design` 🟡 (BLOCKED on a validation reference — see Open Decisions)
- Dual-moment: Personality (birth) + Design (Sun − 88° solar arc; root-find
  against the shared ephemeris). 13 bodies × 2 = 26 activations → gates/lines via
  the Rave Mandala → channels → centers → Type/Authority/Profile/Definition/
  Incarnation Cross. Owns the `center` axis.
- ⚠️ Per spec §2: the 64-gate boundaries + 36 channels must be captured from a
  canonical reference and **validated against a trusted calculator** — not typed
  from memory. Needs a known-good golden chart before its output is trustworthy.
- Adapter (when validated): Type/Authority → theme+polarity; defined centers →
  `center` (hd:*) + theme; Profile lines → theme. Per-gate emission deferred.

## Open decisions

1. **Human Design** — DECIDED: encode the standard public gate/channel/center
   tables, self-validate via golden tests, and flag HD as "needs external
   validation against Jovian Archive" until a known-good reference is supplied.
2. **North Node** — DECIDED (for now): true node (affects node gate activations).
3. **House system default** — Whole Sign (chosen) vs Placidus config.
4. **Name capture at intake** — enables `numerology-chaldean` (name-sourced
   independence group). Currently optional/unused.

## Build order (next)

1. Maya (`tzolkin` full + `dreamspell`) — verified drop-in, low risk.
2. `western-tropical` full per spec — high value, validates cleanly.
3. `human-design` — once a validation reference is supplied.
4. Persistence path + geocoding + shared chart-wheel component.
5. Remaining Phase-2 systems (gene-keys, numerology-chaldean, tarot-birth-cards),
   then Phase-3 breadth.
