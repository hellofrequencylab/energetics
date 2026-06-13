import type { NativeResult, Primitive, SemanticAdapter } from "@/lib/core/contracts";
import { ONTOLOGY_VERSION } from "@/lib/ontology/version";
import { SIGNS } from "@/lib/core/zodiac";
import { meta } from "./engine";
import type { WesternPlacement } from "./engine";

/** Sign → curated theme term (registered in ontology/axes.ts THEMES). */
const SIGN_THEME: Record<string, string> = {
  Aries: "leadership",
  Taurus: "structure",
  Gemini: "communication",
  Cancer: "nurture",
  Leo: "sovereignty",
  Virgo: "analysis",
  Libra: "communication",
  Scorpio: "transformation",
  Sagittarius: "exploration",
  Capricorn: "discipline",
  Aquarius: "vision",
  Pisces: "intuition",
};

/** Native salience of each factor (0..1). */
const FACTOR_WEIGHT: Record<string, number> = { sun: 1.0, moon: 0.85, rising: 0.7 };

/**
 * Maps Western placements into ontology primitives: element (namespaced),
 * polarity, and theme. Separate from the engine so the mapping is auditable.
 */
export const adapter: SemanticAdapter = {
  systemId: meta.id,
  ontologyVersion: ONTOLOGY_VERSION,
  toPrimitives(native: NativeResult): Primitive[] {
    const primitives: Primitive[] = [];

    for (const [key, factor] of Object.entries(native.factors)) {
      const placement = factor.value as WesternPlacement;
      const sign = SIGNS[placement.signIndex];
      if (!sign) continue;
      const weight = FACTOR_WEIGHT[key] ?? 0.5;
      const base = { source: meta.id, derivedFrom: "ephemeris" as const, native: { factorKey: key, raw: placement } };

      primitives.push({ axis: "element", value: `western:${sign.element}`, weight, ...base });
      primitives.push({ axis: "polarity", value: sign.polarity, weight: weight * 0.8, ...base });
      const theme = SIGN_THEME[sign.name];
      if (theme) primitives.push({ axis: "theme", value: theme, weight: weight * 0.7, ...base });
    }

    return primitives;
  },
};
