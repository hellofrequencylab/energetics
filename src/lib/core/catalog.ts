/**
 * The product catalog: which registered systems are OFFERED, and which feed the
 * structural synthesis. This is governance, kept separate from `SystemMeta`
 * (which is the computational contract) and from the registry (which is wiring).
 *
 * Most systems are registered and correct but OFF by default, surfaced only to
 * an admin who can switch them on (see /admin/systems). The default here is the
 * baseline; an admin's live toggles in `energetics.system_settings` override
 * `enabled` on top of it (see lib/core/system-settings.ts).
 *
 * `inSynthesis` is a fixed design rule, not an admin toggle: a system can be
 * shown without feeding the deterministic synthesis (Dreamspell rides alongside
 * the Maya count for interest but never counts as evidence).
 */
export type SystemGroup = "core" | "extended";

export interface CatalogEntry {
  /** Offered to users by default, before any admin override. */
  defaultEnabled: boolean;
  /** Whether this system's primitives feed the deterministic synthesis. */
  inSynthesis: boolean;
  group: SystemGroup;
}

export const CATALOG: Record<string, CatalogEntry> = {
  // Core: on by default, in the synthesis.
  "western-tropical": { defaultEnabled: true, inSynthesis: true, group: "core" },
  "human-design": { defaultEnabled: true, inSynthesis: true, group: "core" },
  "numerology-pythagorean": { defaultEnabled: true, inSynthesis: true, group: "core" },
  tzolkin: { defaultEnabled: true, inSynthesis: true, group: "core" },
  "chinese-bazi": { defaultEnabled: true, inSynthesis: true, group: "core" },
  "tarot-birth-cards": { defaultEnabled: true, inSynthesis: true, group: "core" },
  // Name numerology. Shares the "numerology" independence group with the other
  // numerology systems (see synthesis/independence.ts), since they reduce the
  // same name and date. On by default; it needs the person's full name.
  "numerology-chaldean": { defaultEnabled: true, inSynthesis: true, group: "core" },
  // Dreamspell rides with the Maya count: shown, but kept out of the synthesis.
  dreamspell: { defaultEnabled: true, inSynthesis: false, group: "core" },

  // Extended: registered and correct, but off by default. An admin can switch
  // any of these on.
  "vedic-jyotish": { defaultEnabled: false, inSynthesis: true, group: "extended" },
  hellenistic: { defaultEnabled: false, inSynthesis: true, group: "extended" },
  "gene-keys": { defaultEnabled: false, inSynthesis: true, group: "extended" },
  "zi-wei-dou-shu": { defaultEnabled: false, inSynthesis: true, group: "extended" },
  "nine-star-ki": { defaultEnabled: false, inSynthesis: true, group: "extended" },
  "celtic-tree": { defaultEnabled: false, inSynthesis: true, group: "extended" },
  mahabote: { defaultEnabled: false, inSynthesis: true, group: "extended" },
  "akan-day-names": { defaultEnabled: false, inSynthesis: true, group: "extended" },
  "norse-runes": { defaultEnabled: false, inSynthesis: true, group: "extended" },
  "egyptian-decans": { defaultEnabled: false, inSynthesis: true, group: "extended" },
  // New, registered as off scaffolds.
  "kabbalah-tree-of-life": { defaultEnabled: false, inSynthesis: true, group: "extended" },
  "tibetan-astrology": { defaultEnabled: false, inSynthesis: true, group: "extended" },
  "numerology-lo-shu": { defaultEnabled: false, inSynthesis: true, group: "extended" },
};

/** Unknown ids default to off and in-synthesis, so a new system is never offered
 *  by accident but still counts once an admin enables it. */
export function catalogEntry(id: string): CatalogEntry {
  return CATALOG[id] ?? { defaultEnabled: false, inSynthesis: true, group: "extended" };
}

/** Ids offered by default (before any admin override). */
export function defaultEnabledIds(): Set<string> {
  return new Set(Object.entries(CATALOG).filter(([, c]) => c.defaultEnabled).map(([id]) => id));
}

/** Whether a system's primitives feed the deterministic synthesis. */
export function inSynthesisFor(id: string): boolean {
  return catalogEntry(id).inSynthesis;
}
