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

/** Whole-sign bhava (house from the Lagna) → ontology domain (1:1 wheel). */
const BHAVA_DOMAIN: Record<number, string> = {
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

/**
 * Graha → curated theme, used for the dasha lord, the nakshatra lord, and the
 * atmakaraka. Rahu and Ketu (the lunar nodes) carry their classical keynotes:
 * Rahu reaches and amplifies (exploration), Ketu releases and turns inward
 * (spiritual intuition). The seven grahas follow their familiar significations.
 */
const GRAHA_THEME: Record<string, string> = {
  sun: "sovereignty",
  moon: "nurture",
  mercury: "communication",
  venus: "devotion",
  mars: "leadership",
  jupiter: "vision",
  saturn: "discipline",
  Sun: "sovereignty",
  Moon: "nurture",
  Mercury: "communication",
  Venus: "devotion",
  Mars: "leadership",
  Jupiter: "vision",
  Saturn: "discipline",
  Rahu: "exploration",
  Ketu: "intuition",
};

export const adapter: SemanticAdapter = {
  systemId: meta.id,
  ontologyVersion: ONTOLOGY_VERSION,
  toPrimitives(native: NativeResult): Primitive[] {
    const primitives: Primitive[] = [];
    const emit = (axis: Primitive["axis"], value: string, weight: number, factorKey: string, raw: unknown) => {
      primitives.push({ axis, value, weight, source: meta.id, derivedFrom: "ephemeris", native: { factorKey, raw } });
    };

    for (const [key, weight] of Object.entries(FACTOR_WEIGHT)) {
      const factor = native.factors[key];
      if (!factor) continue;
      const placement = factor.value as VedicPlacement;
      const sign = SIGNS[placement.signIndex];
      if (!sign) continue;

      emit("element", `western:${sign.element}`, weight, key, factor.value);
      emit("polarity", sign.polarity, weight * 0.8, key, factor.value);
      const theme = SIGN_THEME[placement.signIndex];
      if (theme) emit("theme", theme, weight * 0.7, key, factor.value);
      // The bhava a key graha occupies marks a life area. Lagna is house 1 by
      // definition, so its domain (self) is meaningful and not double-counted.
      if (placement.house) {
        const domain = BHAVA_DOMAIN[placement.house];
        if (domain) emit("domain", domain, weight * 0.6, key, factor.value);
      }
    }

    // Janma Rasi (Moon sign) reinforces the Moon's element as the chart a
    // Jyotishi reads first. Lightly weighted since it draws on the same Moon.
    const janmaRasi = native.factors["janma-rasi"];
    if (janmaRasi) {
      const { signIndex } = janmaRasi.value as { signIndex: number };
      const sign = SIGNS[signIndex];
      if (sign) {
        const theme = SIGN_THEME[signIndex];
        if (theme) emit("theme", theme, 0.45, "janma-rasi", janmaRasi.value);
      }
    }

    // Birth dasha lord: the planet whose mahadasha opens life, a strong life
    // theme in Jyotish. Themed by the lord's significations.
    const dashaLord = native.factors["dasha-lord"];
    if (dashaLord) {
      const { lord } = dashaLord.value as { lord: string };
      const theme = GRAHA_THEME[lord];
      if (theme) emit("theme", theme, 0.65, "dasha-lord", dashaLord.value);
    }

    // Atmakaraka: the soul significator. A focused theme from the graha at the
    // highest degree, an inner-purpose accent.
    const atmakaraka = native.factors.atmakaraka;
    if (atmakaraka) {
      const { graha } = atmakaraka.value as { graha: string };
      const theme = GRAHA_THEME[graha];
      if (theme) emit("theme", theme, 0.5, "atmakaraka", atmakaraka.value);
    }

    // Moon's nakshatra lord: the asterism behind the mind, themed by its lord.
    const moon = native.factors.moon;
    if (moon) {
      const { nakshatraLord } = moon.value as VedicPlacement;
      const theme = GRAHA_THEME[nakshatraLord];
      if (theme) emit("theme", theme, 0.45, "moon", moon.value);
    }

    // Tatva (element) emphasis: the dominant element across the nine grahas, a
    // chart-wide temperament, lightly weighted as an aggregate.
    const tatva = native.factors.tatva;
    if (tatva) {
      const { dominant } = tatva.value as { dominant: string };
      if (dominant) emit("element", `western:${dominant}`, 0.45, "tatva", tatva.value);
    }

    return primitives;
  },
};
