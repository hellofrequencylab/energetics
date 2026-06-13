/**
 * Corpus search — a flat, searchable index over the quick-guide + deep-dive
 * tiers. Uses deterministic scored text matching (no external calls). In
 * production this is where pgvector semantic retrieval slots in (spec §9: search
 * only — never structural synthesis).
 */
import {
  ARCANA_GUIDE,
  DAYSIGN_GUIDE,
  NUMBER_GUIDE,
  PLANET_GUIDE,
  SIGN_GUIDE,
  TONE_GUIDE,
} from "./data";
import { PLANET_DEEP, SIGN_DEEP } from "./deep";
import type { CorpusKind } from "./index";

export interface CorpusEntry {
  kind: CorpusKind;
  key: string;
  label: string;
  quick: string;
  deep?: string;
}

const PLANET_LABEL: Record<string, string> = {
  sun: "Sun", moon: "Moon", mercury: "Mercury", venus: "Venus", mars: "Mars",
  jupiter: "Jupiter", saturn: "Saturn", uranus: "Uranus", neptune: "Neptune",
  pluto: "Pluto", northNode: "North Node", southNode: "South Node", chiron: "Chiron",
};

/** The full flat corpus index, built once. */
export const CORPUS_ENTRIES: CorpusEntry[] = [
  ...Object.entries(SIGN_GUIDE).map(([k, v]) => ({ kind: "sign" as const, key: k, label: k, quick: v, deep: SIGN_DEEP[k] })),
  ...Object.entries(PLANET_GUIDE).map(([k, v]) => ({ kind: "planet" as const, key: k, label: PLANET_LABEL[k] ?? k, quick: v, deep: PLANET_DEEP[k] })),
  ...Object.entries(NUMBER_GUIDE).map(([k, v]) => ({ kind: "number" as const, key: k, label: `Number ${k}`, quick: v })),
  ...Object.entries(DAYSIGN_GUIDE).map(([k, v]) => ({ kind: "daysign" as const, key: k, label: k, quick: v })),
  ...Object.entries(TONE_GUIDE).map(([k, v]) => ({ kind: "tone" as const, key: k, label: `Tone ${k}`, quick: v })),
  ...Object.entries(ARCANA_GUIDE).map(([k, v]) => ({ kind: "arcana" as const, key: k, label: v.split(" — ")[0], quick: v })),
];

/** Scored substring search over labels + quick + deep text. */
export function searchCorpus(query: string, limit = 12): CorpusEntry[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];

  const scored = CORPUS_ENTRIES.map((e) => {
    const hay = `${e.label} ${e.quick} ${e.deep ?? ""}`.toLowerCase();
    let score = 0;
    for (const t of terms) {
      if (e.label.toLowerCase().includes(t)) score += 3; // label hits weigh more
      const occ = hay.split(t).length - 1;
      score += occ;
    }
    return { entry: e, score };
  }).filter((s) => s.score > 0);

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.entry);
}
