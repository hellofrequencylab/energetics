import type { NativeResult, Primitive, SemanticAdapter } from "@/lib/core/contracts";
import { ONTOLOGY_VERSION } from "@/lib/ontology/version";
import { meta } from "./engine";

/** Major Arcana number → curated theme (registered in ontology THEMES). */
const ARCANA_THEME: Record<number, string> = {
  0: "exploration", // Fool
  1: "communication", // Magician
  2: "intuition", // High Priestess
  3: "nurture", // Empress
  4: "structure", // Emperor
  5: "devotion", // Hierophant
  6: "devotion", // Lovers
  7: "discipline", // Chariot
  8: "sovereignty", // Strength
  9: "analysis", // Hermit
  10: "transformation", // Wheel
  11: "analysis", // Justice
  12: "sensitivity", // Hanged Man
  13: "transformation", // Death
  14: "service", // Temperance
  15: "sovereignty", // Devil
  16: "transformation", // Tower
  17: "vision", // Star
  18: "intuition", // Moon
  19: "play", // Sun
  20: "vision", // Judgement
  21: "sovereignty", // World
};

export const adapter: SemanticAdapter = {
  systemId: meta.id,
  ontologyVersion: ONTOLOGY_VERSION,
  toPrimitives(native: NativeResult): Primitive[] {
    const primitives: Primitive[] = [];
    for (const key of ["personality", "soul"]) {
      const factor = native.factors[key];
      if (!factor) continue;
      const { number } = factor.value as { number: number };
      const theme = ARCANA_THEME[number];
      if (theme) {
        primitives.push({
          axis: "theme",
          value: theme,
          weight: key === "soul" ? 0.55 : 0.45,
          source: meta.id,
          derivedFrom: "date",
          native: { factorKey: key, raw: number },
        });
      }
    }
    return primitives;
  },
};
