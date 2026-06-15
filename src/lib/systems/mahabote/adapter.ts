import type { NativeResult, Primitive, SemanticAdapter } from "@/lib/core/contracts";
import { ONTOLOGY_VERSION } from "@/lib/ontology/version";
import { meta } from "./engine";

/** The classical planet → curated theme reading (registered THEMES). */
const PLANET_THEME: Record<string, string> = {
  Sun: "sovereignty",
  Moon: "nurture",
  Mars: "leadership",
  Mercury: "communication",
  Jupiter: "vision",
  Venus: "devotion",
  Saturn: "discipline",
};

/**
 * Planet → element. We map the seven planets onto the Chinese five phases by their
 * traditional element affinities (the Chinese seven-luminary element scheme): Sun
 * and Mars carry fire, Moon and Mercury carry water, Jupiter wood, Venus metal,
 * Saturn earth. This lets Mahabote join the five-phase systems on the element axis.
 */
const PLANET_ELEMENT: Record<string, string> = {
  Sun: "fire",
  Mars: "fire",
  Moon: "water",
  Mercury: "water",
  Jupiter: "wood",
  Venus: "metal",
  Saturn: "earth",
};

/** The seven houses → life domain (the arena each station speaks to). */
const HOUSE_DOMAIN: Record<string, string> = {
  Binga: "self",
  Ahta: "resources",
  Yaza: "vocation",
  Adipati: "self",
  Marana: "transformation",
  Thike: "service-health",
  Puti: "home",
};

export const adapter: SemanticAdapter = {
  systemId: meta.id,
  ontologyVersion: ONTOLOGY_VERSION,
  toPrimitives(native: NativeResult): Primitive[] {
    const primitives: Primitive[] = [];

    // Weekday sign: the verifiable core, so the strongest signals come from here.
    const sign = native.factors.sign;
    if (sign) {
      const { planet, polarity } = sign.value as { planet: string; polarity: string };
      const theme = PLANET_THEME[planet];
      if (theme) {
        primitives.push({
          axis: "theme",
          value: theme,
          weight: 0.5,
          source: meta.id,
          derivedFrom: "date",
          native: { factorKey: "sign", raw: planet },
        });
      }
      const element = PLANET_ELEMENT[planet];
      if (element) {
        primitives.push({
          axis: "element",
          value: `chinese:${element}`,
          weight: 0.45,
          source: meta.id,
          derivedFrom: "date",
          native: { factorKey: "sign", raw: planet },
        });
      }
      if (polarity) {
        primitives.push({
          axis: "polarity",
          value: polarity === "active" ? "active" : "receptive",
          weight: 0.4,
          source: meta.id,
          derivedFrom: "date",
          native: { factorKey: "sign", raw: polarity },
        });
      }
    }

    // Where the ruling planet sits → a life-domain emphasis for the chart.
    const rulingHouse = native.factors["ruling-house"];
    if (rulingHouse) {
      const { house } = rulingHouse.value as { house: string };
      const domain = HOUSE_DOMAIN[house];
      if (domain) {
        primitives.push({
          axis: "domain",
          value: domain,
          weight: 0.4,
          source: meta.id,
          derivedFrom: "date",
          native: { factorKey: "ruling-house", raw: house },
        });
      }
    }

    // The mastery (Adipati) planet → a theme you carry as a strength, and the
    // testing (Marana) planet → a domain that asks more of you (transformation).
    const adipati = native.factors["adipati-planet"];
    if (adipati) {
      const { planet } = adipati.value as { planet: string };
      const theme = PLANET_THEME[planet];
      if (theme) {
        primitives.push({
          axis: "theme",
          value: theme,
          weight: 0.35,
          source: meta.id,
          derivedFrom: "date",
          native: { factorKey: "adipati-planet", raw: planet },
        });
      }
    }
    const marana = native.factors["marana-planet"];
    if (marana) {
      primitives.push({
        axis: "domain",
        value: "transformation",
        weight: 0.3,
        source: meta.id,
        derivedFrom: "date",
        native: { factorKey: "marana-planet", raw: (marana.value as { planet: string }).planet },
      });
    }

    return primitives;
  },
};
