import type { NativeResult, Primitive, SemanticAdapter } from "@/lib/core/contracts";
import { ONTOLOGY_VERSION } from "@/lib/ontology/version";
import { SIGNS } from "@/lib/core/zodiac";
import { meta } from "./engine";

/** Sidereal sign index → curated theme (the 12 rasis share the zodiac wheel). */
const SIGN_THEME: Record<number, string> = {
  0: "leadership", 1: "structure", 2: "communication", 3: "nurture",
  4: "sovereignty", 5: "analysis", 6: "communication", 7: "transformation",
  8: "exploration", 9: "discipline", 10: "vision", 11: "intuition",
};

const FACTOR_WEIGHT: Record<string, number> = { moon: 0.9, lagna: 0.7 };

export const adapter: SemanticAdapter = {
  systemId: meta.id,
  ontologyVersion: ONTOLOGY_VERSION,
  toPrimitives(native: NativeResult): Primitive[] {
    const primitives: Primitive[] = [];

    for (const [key, factor] of Object.entries(native.factors)) {
      const placement = factor.value as { signIndex: number };
      const sign = SIGNS[placement.signIndex];
      if (!sign) continue;
      const weight = FACTOR_WEIGHT[key] ?? 0.5;
      const base = { source: meta.id, derivedFrom: "ephemeris" as const, native: { factorKey: key, raw: factor.value } };

      // Rasi elements align with the Western 4-element families (same wheel).
      primitives.push({ axis: "element", value: `western:${sign.element}`, weight, ...base });
      primitives.push({ axis: "polarity", value: sign.polarity, weight: weight * 0.8, ...base });
      const theme = SIGN_THEME[placement.signIndex];
      if (theme) primitives.push({ axis: "theme", value: theme, weight: weight * 0.7, ...base });
    }

    return primitives;
  },
};
