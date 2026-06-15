# 0007. Declared independence groups for honest synthesis breadth

Status: Accepted

## Context

The synthesis ranks convergences by how many INDEPENDENT sources agree (spec
§7.3): within a group of related systems weight is taken as the max (no
stacking), and the count of distinct groups is the primary ranking signal. The
original grouping (ADR-era `weight.ts`) merged systems by their `derivedFrom`
class: every ephemeris-derived system in one group, every date-derived system in
another, name-derived in a third. Breadth therefore capped at three.

That undercounted real independence. The Maya 260-day count, the Chinese
sexagenary cycle, and the solar-year date bands are near-uncorrelated functions
of the date: when two of them independently land on the same theme, that is
genuine corroboration, not one signal in two outfits. Lumping them as a single
"date" group erased that. Meanwhile the original model was right to group the
zodiac systems together (sidereal and decans are deterministic functions of the
same planetary longitudes) and the numerology systems together (they reduce the
same name and date).

The honest principle is "group by the underlying signal or tradition," which is
finer than `derivedFrom` in some places (date) and matches it in others.

## Decision

**An explicit, declared independence map** (`src/lib/synthesis/independence.ts`)
assigns each system to a group by the signal it actually reads, kept separate
from `derivedFrom` (which still labels provenance for display):

- `sky` — Western tropical, Vedic, Hellenistic, Egyptian decans (all read
  planetary longitude).
- `iching-gates` — Human Design, Gene Keys (the I Ching gate wheel; Gene Keys
  builds on Human Design).
- `chinese` — BaZi, Nine Star Ki, Zi Wei Dou Shu (Chinese calendrical
  metaphysics from the same birth moment).
- `maya` — Tzolk'in (and Dreamspell, which rides alongside but is kept out of
  the synthesis by the catalog).
- `seasonal` — Celtic tree, Norse runes (solar-year date bands).
- `numerology` — Pythagorean, Chaldean, Lo Shu, tarot birth cards (digit and
  letter reduction of the same name and date).
- `burmese`, `akan`, `tibetan`, `kabbalah` — distinct standalone traditions.

`weight.ts` unions systems by this declared group and still honors the
`dependsOn` closure, so a hard derivation is never counted as independent.
Unlisted systems fall back to their own id (counted as independent), so a new
system is only ever split out, never silently folded into a group.

## Consequences

- Breadth can now exceed three when genuinely distinct traditions agree, which is
  the intended, more honest behavior. Correlated families (all zodiac, all
  Chinese, all numerology) still count once.
- Synthesis output (the `independentGroups` count and the ranking) changes. No
  migration is needed: `syntheses` snapshots are recomputed live, and the
  narrative cache is content-addressed by a prompt that includes the group count,
  so stale readings self-invalidate rather than being served.
- The judgment lives in one auditable map. Re-grouping is a one-line edit there,
  reviewed like any code, rather than a property smeared across 21 system folders.
- `derivedFrom` is unchanged and still drives provenance labels and the example
  language in the narrative prompt.
