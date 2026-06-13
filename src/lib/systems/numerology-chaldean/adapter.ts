import type { NativeResult, Primitive, SemanticAdapter } from "@/lib/core/contracts";
import { ONTOLOGY_VERSION } from "@/lib/ontology/version";
import { meta } from "./engine";

/** Chaldean name number → curated theme (registered in ontology THEMES). */
const NUMBER_THEME: Record<number, string> = {
  1: "leadership",
  2: "sensitivity",
  3: "communication",
  4: "structure",
  5: "exploration",
  6: "nurture",
  7: "intuition",
  8: "sovereignty",
  9: "transformation",
};

export const adapter: SemanticAdapter = {
  systemId: meta.id,
  ontologyVersion: ONTOLOGY_VERSION,
  toPrimitives(native: NativeResult): Primitive[] {
    const factor = native.factors["name-number"];
    if (!factor) return [];
    const n = factor.value as number;
    const base = { source: meta.id, derivedFrom: "name" as const, native: { factorKey: "name-number", raw: n } };
    const primitives: Primitive[] = [];

    const theme = NUMBER_THEME[n];
    if (theme) primitives.push({ axis: "theme", value: theme, weight: 0.7, ...base });
    primitives.push({ axis: "polarity", value: n % 2 === 1 ? "active" : "receptive", weight: 0.5, ...base });

    return primitives;
  },
};
