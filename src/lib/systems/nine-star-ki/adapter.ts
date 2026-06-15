import type { NativeResult, Primitive, SemanticAdapter } from "@/lib/core/contracts";
import { isRegistered } from "@/lib/ontology/axes";
import { ONTOLOGY_VERSION } from "@/lib/ontology/version";
import { meta } from "./engine";

/**
 * Each of the nine stars carries a five-phase element (mapped to the ontology
 * element axis) plus a curated theme that reads its character. The themes are
 * defensible one-word readings of each star's well-known quality: water listens
 * beneath the surface, earth holds and tends, wood reaches and plans, metal
 * refines and leads, fire shines and connects.
 */
const STAR_THEME: Record<number, string> = {
  1: "intuition", // 1 White, water: depth and adaptability
  2: "nurture", // 2 Black, earth: support and care
  3: "exploration", // 3 Jade, wood: drive and initiative
  4: "communication", // 4 Green, wood: spread and exchange
  5: "transformation", // 5 Yellow, earth: the center, pivot of change
  6: "leadership", // 6 White, metal: authority and order
  7: "play", // 7 Red, metal: pleasure and expression
  8: "structure", // 8 White, earth: stability and reform
  9: "vision", // 9 Purple, fire: insight and visibility
};

/** Each star also leans toward a life domain (its native arena of expression). */
const STAR_DOMAIN: Record<number, string> = {
  1: "spirituality",
  2: "home",
  3: "creativity",
  4: "communication",
  5: "transformation",
  6: "vocation",
  7: "relationship",
  8: "resources",
  9: "self",
};

const polarityValue = (raw: string): string =>
  raw === "yang" ? "active" : raw === "yin" ? "receptive" : "balanced";

export const adapter: SemanticAdapter = {
  systemId: meta.id,
  ontologyVersion: ONTOLOGY_VERSION,
  toPrimitives(native: NativeResult): Primitive[] {
    const primitives: Primitive[] = [];
    // Self-check every emitted value against the registered vocabulary, so a
    // future star/element/theme change can never silently leak an unknown term.
    const push = (p: Primitive) => {
      if (isRegistered(p.axis, p.value)) primitives.push(p);
    };

    // (factor key, element weight, polarity weight, theme weight, domain weight)
    const slots: [string, number, number, number, number][] = [
      ["principal-star", 0.6, 0.5, 0.6, 0.45],
      ["monthly-star", 0.35, 0.3, 0.4, 0.3],
      ["tendency-star", 0.25, 0, 0.25, 0],
    ];

    for (const [key, elW, polW, themeW, domW] of slots) {
      const factor = native.factors[key];
      if (!factor) continue;
      const { star, element, polarity } = factor.value as {
        star: number;
        element: string;
        polarity: string;
      };

      if (element) {
        push({
          axis: "element",
          value: `chinese:${element}`,
          weight: elW,
          source: meta.id,
          derivedFrom: "date",
          native: { factorKey: key, raw: element },
        });
      }
      if (polW > 0 && polarity) {
        push({
          axis: "polarity",
          value: polarityValue(polarity),
          weight: polW,
          source: meta.id,
          derivedFrom: "date",
          native: { factorKey: key, raw: polarity },
        });
      }
      const theme = STAR_THEME[star];
      if (theme) {
        push({
          axis: "theme",
          value: theme,
          weight: themeW,
          source: meta.id,
          derivedFrom: "date",
          native: { factorKey: key, raw: star },
        });
      }
      const domain = STAR_DOMAIN[star];
      if (domW > 0 && domain) {
        push({
          axis: "domain",
          value: domain,
          weight: domW,
          source: meta.id,
          derivedFrom: "date",
          native: { factorKey: key, raw: star },
        });
      }
    }

    return primitives;
  },
};
