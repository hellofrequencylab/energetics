import type { NativeResult, Primitive, SemanticAdapter } from "@/lib/core/contracts";
import { ONTOLOGY_VERSION } from "@/lib/ontology/version";
import { SIGNS } from "@/lib/core/zodiac";
import { meta } from "./engine";
import type { WesternPlacement } from "./engine";

/**
 * §5a body weights — by traditional importance. Generational planets are damped
 * HARD (0.20): whole cohorts share their sign, so undamped they would manufacture
 * false convergence across everyone born in an era.
 */
const WEIGHT: Record<string, number> = {
  sun: 0.9,
  moon: 0.9,
  ascendant: 0.9,
  mercury: 0.6,
  venus: 0.6,
  mars: 0.6,
  jupiter: 0.45,
  saturn: 0.45,
  northNode: 0.4,
  chiron: 0.4,
  uranus: 0.2,
  neptune: 0.2,
  pluto: 0.2,
};

/** §5b explicit per-sign themes (the modality theme is derived separately). */
const SIGN_THEMES: Record<number, string[]> = {
  0: ["leadership", "exploration"], // Aries
  1: ["structure", "nurture"], // Taurus
  2: ["communication", "exploration"], // Gemini
  3: ["nurture", "sensitivity"], // Cancer
  4: ["sovereignty", "play"], // Leo
  5: ["analysis", "service", "discipline"], // Virgo
  6: ["devotion", "vision"], // Libra
  7: ["transformation", "sovereignty"], // Scorpio
  8: ["exploration", "vision"], // Sagittarius
  9: ["structure", "discipline"], // Capricorn
  10: ["vision", "exploration"], // Aquarius
  11: ["intuition", "sensitivity", "devotion"], // Pisces
};

/** §5b modality → theme crosswalk. */
const MODALITY_THEME: Record<string, string> = {
  cardinal: "leadership",
  fixed: "structure",
  mutable: "exploration",
};

/** §5c body → themes. */
const BODY_THEMES: Record<string, string[]> = {
  sun: ["sovereignty", "leadership"],
  moon: ["sensitivity", "nurture"],
  mercury: ["communication", "analysis"],
  venus: ["devotion", "play"],
  mars: ["leadership", "discipline"],
  jupiter: ["vision", "exploration"],
  saturn: ["discipline", "structure"],
  uranus: ["transformation", "exploration"],
  neptune: ["intuition", "devotion"],
  pluto: ["transformation", "sovereignty"],
  northNode: ["vision", "service"],
  chiron: ["transformation", "service"],
};

/** §5d house → domain (1:1 with the ontology domain vocabulary). */
const HOUSE_DOMAIN: Record<number, string> = {
  1: "self",
  2: "resources",
  3: "communication",
  4: "home",
  5: "creativity",
  6: "service-health",
  7: "relationship",
  8: "transformation",
  9: "philosophy",
  10: "vocation",
  11: "community",
  12: "spirituality",
};

const BODY_KEYS = Object.keys(BODY_THEMES);

export const adapter: SemanticAdapter = {
  systemId: meta.id,
  ontologyVersion: ONTOLOGY_VERSION,
  toPrimitives(native: NativeResult): Primitive[] {
    const primitives: Primitive[] = [];
    const emit = (
      axis: Primitive["axis"],
      value: string,
      weight: number,
      factorKey: string,
      raw: unknown,
    ) => {
      primitives.push({ axis, value, weight, source: meta.id, derivedFrom: "ephemeris", native: { factorKey, raw } });
    };

    // Bodies: element + polarity + themes (sign ∪ body ∪ modality) + house→domain.
    for (const key of BODY_KEYS) {
      const factor = native.factors[key];
      if (!factor) continue;
      const p = factor.value as WesternPlacement;
      const sign = SIGNS[p.signIndex];
      if (!sign) continue;
      const w = WEIGHT[key] ?? 0.4;

      emit("element", `western:${sign.element}`, w, key, p);
      emit("polarity", sign.polarity, w, key, p);
      const themes = new Set([...(SIGN_THEMES[p.signIndex] ?? []), ...(BODY_THEMES[key] ?? []), MODALITY_THEME[sign.modality]]);
      for (const t of themes) if (t) emit("theme", t, w, key, p);
      if (p.house) {
        const domain = HOUSE_DOMAIN[p.house];
        if (domain) emit("domain", domain, w, key, p);
      }
    }

    // Ascendant: element + polarity + sign/modality themes (no body theme, no domain).
    const asc = native.factors.ascendant;
    if (asc) {
      const a = asc.value as { signIndex: number };
      const sign = SIGNS[a.signIndex];
      if (sign) {
        const w = WEIGHT.ascendant;
        emit("element", `western:${sign.element}`, w, "ascendant", a);
        emit("polarity", sign.polarity, w, "ascendant", a);
        const themes = new Set([...(SIGN_THEMES[a.signIndex] ?? []), MODALITY_THEME[sign.modality]]);
        for (const t of themes) if (t) emit("theme", t, w, "ascendant", a);
      }
    }

    return primitives;
  },
};
