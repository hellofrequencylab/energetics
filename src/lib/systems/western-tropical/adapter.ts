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

/**
 * §5b element → theme crosswalk. Each Western element has a natural keynote: fire
 * initiates, earth builds, air connects, water feels. Used for the overall chart
 * signature so a dominant element adds a cross-system theme, not just an element.
 */
const ELEMENT_THEME: Record<string, string> = {
  fire: "leadership",
  earth: "structure",
  air: "communication",
  water: "sensitivity",
};

/**
 * Chart-level signature weights. Damped below any single luminary (0.9) so the
 * whole-chart read informs convergence without drowning out specific placements.
 */
const SIGNATURE_WEIGHT = 0.5;

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

/** Classical planet → theme, for dignity layers (triplicity, decan, chart ruler). */
const PLANET_THEME: Record<string, string> = {
  Sun: "sovereignty",
  Moon: "nurture",
  Mercury: "communication",
  Venus: "devotion",
  Mars: "leadership",
  Jupiter: "vision",
  Saturn: "discipline",
};

/**
 * Lunar phase → theme. The waxing half builds and reaches out, the waning half
 * distills and turns inward. The quarters mark turning points.
 */
const PHASE_THEME: Record<string, string> = {
  "New Moon": "vision",
  "Waxing Crescent": "exploration",
  "First Quarter": "leadership",
  "Waxing Gibbous": "analysis",
  "Full Moon": "devotion",
  "Waning Gibbous": "service",
  "Last Quarter": "transformation",
  "Waning Crescent": "intuition",
};

/** Lunar phase → polarity. Waxing half leans active, waning half receptive. */
const PHASE_POLARITY: Record<string, string> = {
  "New Moon": "balanced",
  "Waxing Crescent": "active",
  "First Quarter": "active",
  "Waxing Gibbous": "active",
  "Full Moon": "balanced",
  "Waning Gibbous": "receptive",
  "Last Quarter": "receptive",
  "Waning Crescent": "receptive",
};

/** Quadruplicity (angular/succedent/cadent) → theme: drive, hold, adapt. */
const QUADRUPLICITY_THEME: Record<string, string> = {
  angular: "leadership",
  succedent: "structure",
  cadent: "exploration",
};

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

    // Overall chart signature: one element, one polarity, one modality theme, and
    // one element theme for the whole nativity. Damped so it nudges convergence
    // rather than dominating. `balanced` polarity is a registered, meaningful term.
    const dominant = native.factors.dominant;
    if (dominant) {
      const d = dominant.value as {
        element: string;
        modality: string;
        polarity: string;
      };
      if (d.element) emit("element", `western:${d.element}`, SIGNATURE_WEIGHT, "dominant", d);
      if (d.polarity) emit("polarity", d.polarity, SIGNATURE_WEIGHT, "dominant", d);
      const signatureThemes = new Set([ELEMENT_THEME[d.element], MODALITY_THEME[d.modality]]);
      for (const t of signatureThemes) if (t) emit("theme", t, SIGNATURE_WEIGHT, "dominant", d);
    }

    // Sect: a day chart leans active (diurnal, outward), a night chart receptive
    // (nocturnal, inward). A whole-chart temperament note, lightly weighted.
    const sect = native.factors.sect;
    if (sect) {
      const s = sect.value as { sect: string };
      emit("polarity", s.sect === "day" ? "active" : "receptive", 0.4, "sect", s);
    }

    // Sun's active triplicity ruler → its planetary theme. The dignity lord of
    // the Sun's element adds a focused theme without re-emitting an element.
    const triplicity = native.factors.triplicity;
    if (triplicity) {
      const t = triplicity.value as { active: string | null; day: string };
      const ruler = t.active ?? t.day;
      const theme = PLANET_THEME[ruler];
      if (theme) emit("theme", theme, 0.4, "triplicity", t);
    }

    // Sun's decan face ruler → its planetary theme. A finer solar accent.
    const decan = native.factors.decan;
    if (decan) {
      const d = decan.value as { ruler: string };
      const theme = PLANET_THEME[d.ruler];
      if (theme) emit("theme", theme, 0.4, "decan", d);
    }

    // Chart ruler: the domicile lord of the Ascendant. It speaks for the whole
    // nativity, so it earns a strong theme, plus the element and domain of where
    // it actually sits when those are known.
    const chartRuler = native.factors["chart-ruler"];
    if (chartRuler) {
      const cr = chartRuler.value as { ruler: string; signIndex: number | null; house: number | null };
      const theme = PLANET_THEME[cr.ruler];
      if (theme) emit("theme", theme, 0.7, "chart-ruler", cr);
      if (cr.signIndex != null && SIGNS[cr.signIndex]) {
        emit("element", `western:${SIGNS[cr.signIndex].element}`, 0.5, "chart-ruler", cr);
      }
      if (cr.house != null) {
        const domain = HOUSE_DOMAIN[cr.house];
        if (domain) emit("domain", domain, 0.5, "chart-ruler", cr);
      }
    }

    // Chart shape: hemisphere and quadruplicity emphasis. The dominant
    // quadruplicity adds a temperament theme and polarity, lightly weighted as
    // a whole-chart aggregate.
    const shape = native.factors["chart-shape"];
    if (shape) {
      const sh = shape.value as { hemisphereVertical: string; dominantQuadruplicity: string };
      const theme = QUADRUPLICITY_THEME[sh.dominantQuadruplicity];
      if (theme) emit("theme", theme, 0.4, "chart-shape", sh);
      // Weight above the horizon leans active (public, outward), below receptive.
      emit("polarity", sh.hemisphereVertical === "above" ? "active" : "receptive", 0.35, "chart-shape", sh);
    }

    // Lunar phase: a polarity (waxing active, waning receptive) and a phase theme.
    const phase = native.factors["lunar-phase"];
    if (phase) {
      const name = phase.value as string;
      const pol = PHASE_POLARITY[name];
      if (pol) emit("polarity", pol, 0.4, "lunar-phase", name);
      const theme = PHASE_THEME[name];
      if (theme) emit("theme", theme, 0.4, "lunar-phase", name);
    }

    return primitives;
  },
};
