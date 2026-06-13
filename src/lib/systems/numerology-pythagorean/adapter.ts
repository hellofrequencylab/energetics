import type { NativeResult, Primitive, SemanticAdapter } from "@/lib/core/contracts";
import { ONTOLOGY_VERSION } from "@/lib/ontology/version";
import { meta } from "./engine";

/** Life Path number → curated theme (registered in ontology THEMES). */
const LIFEPATH_THEME: Record<number, string> = {
  1: "leadership",
  2: "sensitivity",
  3: "communication",
  4: "structure",
  5: "exploration",
  6: "nurture",
  7: "analysis",
  8: "sovereignty",
  9: "service",
  11: "intuition",
  22: "vision",
  33: "devotion",
};

export const adapter: SemanticAdapter = {
  systemId: meta.id,
  ontologyVersion: ONTOLOGY_VERSION,
  toPrimitives(native: NativeResult): Primitive[] {
    const factor = native.factors["life-path"];
    if (!factor) return [];
    const lifePath = factor.value as number;
    const base = { source: meta.id, derivedFrom: "date" as const, native: { factorKey: "life-path", raw: lifePath } };
    const primitives: Primitive[] = [];

    const theme = LIFEPATH_THEME[lifePath];
    if (theme) primitives.push({ axis: "theme", value: theme, weight: 1.0, ...base });

    // Odd numbers read active/initiating; even receptive. Masters read active.
    const polarity = lifePath % 2 === 1 || lifePath >= 11 ? "active" : "receptive";
    primitives.push({ axis: "polarity", value: polarity, weight: 0.6, ...base });

    return primitives;
  },
};
