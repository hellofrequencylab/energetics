import type { NativeResult, Primitive, SemanticAdapter } from "@/lib/core/contracts";
import { ONTOLOGY_VERSION } from "@/lib/ontology/version";
import { SIGNS } from "@/lib/core/zodiac";
import { meta } from "./engine";

/** Classical planet → curated theme (its keynote signification). */
const PLANET_THEME: Record<string, string> = {
  Mars: "leadership",
  Venus: "devotion",
  Mercury: "communication",
  Moon: "nurture",
  Sun: "sovereignty",
  Jupiter: "vision",
  Saturn: "discipline",
};

/**
 * Angularity of the sect light → domain emphasis. An angular light drives the
 * sense of self, a succedent one anchors resources, a cadent one turns to
 * learning and exchange. A defensible, conservative crosswalk.
 */
const ANGULARITY_DOMAIN: Record<string, string> = {
  angular: "self",
  succedent: "resources",
  cadent: "communication",
};

export const adapter: SemanticAdapter = {
  systemId: meta.id,
  ontologyVersion: ONTOLOGY_VERSION,
  toPrimitives(native: NativeResult): Primitive[] {
    const primitives: Primitive[] = [];
    const emit = (axis: Primitive["axis"], value: string, weight: number, factorKey: string, raw: unknown) => {
      primitives.push({ axis, value, weight, source: meta.id, derivedFrom: "ephemeris", native: { factorKey, raw } });
    };

    // Sect: a day chart leans active, a night chart receptive. A whole-chart tone.
    const sect = native.factors.sect?.value as string | undefined;
    if (sect) emit("polarity", sect === "Day" ? "active" : "receptive", 0.5, "sect", sect);

    // Sect light placement: the leading luminary's sign element + polarity, plus
    // its planetary theme and an angularity-based domain. The strongest voice.
    const light = native.factors["sect-light-detail"]?.value as
      | { light: string; signIndex: number; angularity: string }
      | undefined;
    if (light) {
      const sign = SIGNS[light.signIndex];
      if (sign) {
        emit("element", `western:${sign.element}`, 0.8, "sect-light-detail", light);
        emit("polarity", sign.polarity, 0.6, "sect-light-detail", light);
      }
      const ptheme = PLANET_THEME[light.light];
      if (ptheme) emit("theme", ptheme, 0.7, "sect-light-detail", light);
      const domain = ANGULARITY_DOMAIN[light.angularity];
      if (domain) emit("domain", domain, 0.5, "sect-light-detail", light);
    }

    // Active triplicity lord of the sect light → its theme. A dignity accent.
    const trip = native.factors["triplicity-lords"]?.value as { active: string } | undefined;
    if (trip) {
      const theme = PLANET_THEME[trip.active];
      if (theme) emit("theme", theme, 0.5, "triplicity-lords", trip);
    }

    // Chart ruler: the domicile lord of the Ascendant, speaks for the whole
    // chart. A strong theme.
    const ruler = native.factors["chart-ruler"]?.value as string | undefined;
    if (ruler && PLANET_THEME[ruler]) emit("theme", PLANET_THEME[ruler], 0.7, "chart-ruler", ruler);

    // Lot of Fortune: the body's fortune, a lunar lot. Its sign element plus the
    // theme of its lord, themed toward resources and the body.
    const fortune = native.factors.fortune?.value as { signIndex: number; ruler: string } | undefined;
    if (fortune) {
      const sign = SIGNS[fortune.signIndex];
      if (sign) emit("element", `western:${sign.element}`, 0.45, "fortune", fortune);
      if (fortune.ruler && PLANET_THEME[fortune.ruler]) emit("theme", PLANET_THEME[fortune.ruler], 0.4, "fortune", fortune);
      emit("domain", "resources", 0.35, "fortune", fortune);
    }

    // Lot of Spirit: the solar lot, of mind and action and purpose. Its sign
    // element plus its lord's theme, themed toward vocation.
    const spirit = native.factors.spirit?.value as { signIndex: number; ruler: string } | undefined;
    if (spirit) {
      const sign = SIGNS[spirit.signIndex];
      if (sign) emit("element", `western:${sign.element}`, 0.4, "spirit", spirit);
      if (spirit.ruler && PLANET_THEME[spirit.ruler]) emit("theme", PLANET_THEME[spirit.ruler], 0.4, "spirit", spirit);
      emit("domain", "vocation", 0.35, "spirit", spirit);
    }

    // Benefic of sect: the planet most able to help. A lighter supportive theme.
    const benefic = native.factors["sect-benefic"]?.value as string | undefined;
    if (benefic && PLANET_THEME[benefic]) emit("theme", PLANET_THEME[benefic], 0.4, "sect-benefic", benefic);

    return primitives;
  },
};
