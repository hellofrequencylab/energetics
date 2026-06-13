import type { NativeResult, Primitive, SemanticAdapter } from "@/lib/core/contracts";
import { ONTOLOGY_VERSION } from "@/lib/ontology/version";
import { SIGNS } from "@/lib/core/zodiac";
import { meta } from "./engine";
import type { VedicPlacement } from "./engine";

/** Sidereal sign index → curated theme (the 12 rasis share the zodiac wheel). */
const SIGN_THEME: Record<number, string> = {
  0: "leadership", 1: "structure", 2: "communication", 3: "nurture",
  4: "sovereignty", 5: "analysis", 6: "communication", 7: "transformation",
  8: "exploration", 9: "discipline", 10: "vision", 11: "intuition",
};

// Jyotish emphasizes the Moon and Lagna. Vedic shares the ephemeris group with
// Western, so we emit a focused set rather than all 9 grahas (which would only
// reinforce the same group via the within-group max).
const FACTOR_WEIGHT: Record<string, number> = { moon: 0.9, lagna: 0.7, sun: 0.6 };

export const adapter: SemanticAdapter = {
  systemId: meta.id,
  ontologyVersion: ONTOLOGY_VERSION,
  toPrimitives(native: NativeResult): Primitive[] {
    const primitives: Primitive[] = [];

    for (const [key, weight] of Object.entries(FACTOR_WEIGHT)) {
      const factor = native.factors[key];
      if (!factor) continue;
      const placement = factor.value as VedicPlacement;
      const sign = SIGNS[placement.signIndex];
      if (!sign) continue;
      const base = { source: meta.id, derivedFrom: "ephemeris" as const, native: { factorKey: key, raw: factor.value } };

      primitives.push({ axis: "element", value: `western:${sign.element}`, weight, ...base });
      primitives.push({ axis: "polarity", value: sign.polarity, weight: weight * 0.8, ...base });
      const theme = SIGN_THEME[placement.signIndex];
      if (theme) primitives.push({ axis: "theme", value: theme, weight: weight * 0.7, ...base });
    }

    return primitives;
  },
};
