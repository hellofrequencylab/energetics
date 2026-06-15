/**
 * Declared independence groups (spec §7.3) — the judgment behind honest breadth.
 *
 * Two systems share a group when they read the SAME underlying signal or
 * tradition, so their agreement is mostly one voice in two outfits. Within a
 * group, weight never stacks (we take the max in `weight.ts`). Across groups,
 * agreement is genuine cross-confirmation and is rewarded, and the number of
 * distinct groups backing a theme is the PRIMARY ranking signal.
 *
 * Why declared, not inferred from `derivedFrom`: collapsing every date-derived
 * system into one bucket understated real breadth. The Maya 260-day count, the
 * Chinese sexagenary cycle, and the solar-year date bands are near-uncorrelated
 * functions of the date, so when two of them independently land on the same
 * theme that is meaningful corroboration. But systems that read the SAME signal
 * must stay grouped or they double-count: every zodiac system is a deterministic
 * function of planetary longitude, and every numerology system reduces the same
 * name and date. This map encodes that distinction in one auditable place.
 *
 * `derivedFrom` is unchanged and still labels provenance for display; this is a
 * separate, finer grouping used only for independence weighting.
 *
 * Unlisted systems fall back to their own id (counted as independent), so a new
 * system is never silently folded into an existing group, only ever split out.
 */
export const INDEPENDENCE_GROUP: Record<string, string> = {
  // The sky. Tropical signs, sidereal signs, and decans are all deterministic
  // functions of the same planetary longitudes, so they are one voice.
  "western-tropical": "sky",
  "vedic-jyotish": "sky",
  hellenistic: "sky",
  "egyptian-decans": "sky",

  // The I Ching gate wheel read from planetary positions: a distinct reading of
  // the sky from the zodiac. Gene Keys is built on the Human Design wheel.
  "human-design": "iching-gates",
  "gene-keys": "iching-gates",

  // Chinese calendrical metaphysics from the same birth moment (solar terms,
  // ganzhi pillars, the Purple Star lunar chart). Same basis, so one voice.
  "chinese-bazi": "chinese",
  "nine-star-ki": "chinese",
  "zi-wei-dou-shu": "chinese",

  // The Maya 260-day count. (Dreamspell rides alongside it and is grouped here
  // for completeness, though it is kept out of the synthesis by the catalog.)
  tzolkin: "maya",
  dreamspell: "maya",

  // Date bands tied to the solar year.
  "celtic-tree": "seasonal",
  "norse-runes": "seasonal",

  // Digit and letter reduction of the same name and date. Pythagorean, Chaldean,
  // the Lo Shu grid, and tarot birth cards all reduce the same inputs, so they
  // corroborate each other trivially and count as one voice.
  "numerology-pythagorean": "numerology",
  "numerology-chaldean": "numerology",
  "numerology-lo-shu": "numerology",
  "tarot-birth-cards": "numerology",

  // Distinct standalone traditions, each its own voice.
  mahabote: "burmese",
  "akan-day-names": "akan",
  "tibetan-astrology": "tibetan",
  "kabbalah-tree-of-life": "kabbalah",
};

/** The declared group for a system, or its own id when undeclared. */
export function declaredGroup(systemId: string): string {
  return INDEPENDENCE_GROUP[systemId] ?? systemId;
}
