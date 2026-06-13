/**
 * Controlled vocabularies per ontology axis (spec §6).
 *
 * Adapters may only emit terms registered here. `element` is kept in NAMESPACED
 * families so a Western 4-element value is never silently merged with a Chinese
 * 5-element value — any cross-family relationship lives in crosswalks.ts.
 */
import type { OntologyAxis } from "../core/contracts";

export type { OntologyAxis };

/** Element families, namespaced. Stored values look like "western:fire". */
export const ELEMENTS = {
  western: ["fire", "earth", "air", "water"] as const,
  chinese: ["wood", "fire", "earth", "metal", "water"] as const,
};

export function elementTerm(family: keyof typeof ELEMENTS, value: string): string {
  return `${family}:${value}`;
}

/** Polarity — yin/yang, active/receptive, initiating/waiting all map here. */
export const POLARITY = ["active", "receptive", "balanced"] as const;

/**
 * Theme — curated, extensible tag set. Adding a term bumps ONTOLOGY_VERSION.
 */
export const THEMES = [
  "leadership",
  "communication",
  "sensitivity",
  "transformation",
  "structure",
  "nurture",
  "exploration",
  "discipline",
  "intuition",
  "vision",
  "service",
  "sovereignty",
  "devotion",
  "analysis",
  "play",
] as const;

export type Theme = (typeof THEMES)[number];

/** Phase 2 axes (declared now, populated as those systems land). */
export const CENTERS: readonly string[] = [];
export const DOMAINS = [
  "self",
  "resources",
  "communication",
  "home",
  "creativity",
  "service-health",
  "relationship",
  "transformation",
  "philosophy",
  "vocation",
  "community",
  "spirituality",
] as const;

const VOCAB: Record<OntologyAxis, readonly string[]> = {
  element: [
    ...ELEMENTS.western.map((v) => `western:${v}`),
    ...ELEMENTS.chinese.map((v) => `chinese:${v}`),
  ],
  polarity: POLARITY,
  theme: THEMES,
  center: CENTERS,
  domain: DOMAINS,
};

/** True if `value` is a registered term on `axis`. Adapters self-check with this. */
export function isRegistered(axis: OntologyAxis, value: string): boolean {
  return VOCAB[axis].includes(value);
}
