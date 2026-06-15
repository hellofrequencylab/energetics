import type { NativeResult, Primitive, SemanticAdapter } from "@/lib/core/contracts";
import { ONTOLOGY_VERSION } from "@/lib/ontology/version";
import { meta } from "./engine";

/**
 * The twelve year animals → curated theme (registered THEMES). These mirror the
 * widely shared East Asian animal readings, phrased as one-word qualities: the
 * Rat connects and gathers, the Tiger leads, the Snake transforms, and so on. The
 * Tibetan animal names map to the same set (Sheep, Bird, Pig are the Tibetan forms
 * of Goat, Rooster, Boar).
 */
const ANIMAL_THEME: Record<string, string> = {
  Rat: "communication",
  Ox: "discipline",
  Tiger: "leadership",
  Rabbit: "sensitivity",
  Dragon: "sovereignty",
  Snake: "transformation",
  Horse: "exploration",
  Sheep: "nurture",
  Monkey: "play",
  Bird: "analysis",
  Dog: "devotion",
  Pig: "nurture",
};

/** Five-phase element → curated theme, matching the other five-phase systems. */
const ELEMENT_THEME: Record<string, string> = {
  wood: "vision",
  fire: "leadership",
  earth: "nurture",
  metal: "structure",
  water: "intuition",
};

/** Parkha trigram → a life domain its quality speaks to. */
const PARKHA_DOMAIN: Record<string, string> = {
  Li: "self",
  Khon: "home",
  Dva: "relationship",
  Khen: "vocation",
  Kham: "transformation",
  Gin: "spirituality",
  Zin: "creativity",
  Zon: "service-health",
};

export const adapter: SemanticAdapter = {
  systemId: meta.id,
  ontologyVersion: ONTOLOGY_VERSION,
  toPrimitives(native: NativeResult): Primitive[] {
    const primitives: Primitive[] = [];

    // Year element: the core elemental strand of the chart, strongest signal.
    const yearElement = native.factors["year-element"];
    if (yearElement) {
      const { element, gender } = yearElement.value as { element: string; gender: string };
      if (element) {
        primitives.push({
          axis: "element",
          value: `chinese:${element}`,
          weight: 0.8,
          source: meta.id,
          derivedFrom: "date",
          native: { factorKey: "year-element", raw: element },
        });
        const theme = ELEMENT_THEME[element];
        if (theme) {
          primitives.push({
            axis: "theme",
            value: theme,
            weight: 0.6,
            source: meta.id,
            derivedFrom: "date",
            native: { factorKey: "year-element", raw: element },
          });
        }
      }
      if (gender) {
        primitives.push({
          axis: "polarity",
          value: gender === "yang" ? "active" : "receptive",
          weight: 0.6,
          source: meta.id,
          derivedFrom: "date",
          native: { factorKey: "year-element", raw: gender },
        });
      }
    }

    // Year animal → theme (its shared temperament reading).
    const yearAnimal = native.factors["year-animal"];
    if (yearAnimal) {
      const { animal } = yearAnimal.value as { animal: string };
      const theme = ANIMAL_THEME[animal];
      if (theme) {
        primitives.push({
          axis: "theme",
          value: theme,
          weight: 0.5,
          source: meta.id,
          derivedFrom: "date",
          native: { factorKey: "year-animal", raw: animal },
        });
      }
    }

    // Parkha trigram → element (its own affinity) + a life domain.
    const parkha = native.factors.parkha;
    if (parkha) {
      const { name, element } = parkha.value as { name: string; element: string };
      if (element) {
        primitives.push({
          axis: "element",
          value: `chinese:${element}`,
          weight: 0.35,
          source: meta.id,
          derivedFrom: "date",
          native: { factorKey: "parkha", raw: element },
        });
      }
      const domain = PARKHA_DOMAIN[name];
      if (domain) {
        primitives.push({
          axis: "domain",
          value: domain,
          weight: 0.45,
          source: meta.id,
          derivedFrom: "date",
          native: { factorKey: "parkha", raw: name },
        });
      }
    }

    // Mewa number → element (its protective-energy phase). Light backing signal.
    const mewa = native.factors.mewa;
    if (mewa) {
      const { element } = mewa.value as { element: string };
      if (element) {
        primitives.push({
          axis: "element",
          value: `chinese:${element}`,
          weight: 0.3,
          source: meta.id,
          derivedFrom: "date",
          native: { factorKey: "mewa", raw: element },
        });
      }
    }

    return primitives;
  },
};
