import type { NativeResult, Primitive, SemanticAdapter } from "@/lib/core/contracts";
import { elementTerm, isRegistered } from "@/lib/ontology/axes";
import { ONTOLOGY_VERSION } from "@/lib/ontology/version";
import { meta } from "./engine";

/**
 * Birth weekday to ontology themes (registered in THEMES), read from the day's
 * traditional character in our own words. The primary theme leads; a secondary
 * theme captures the second facet of days whose character is two-sided, at a
 * lower weight.
 */
const DAY_THEME: Record<string, string[]> = {
  Sunday: ["leadership", "sovereignty"], // protective leader (the universe)
  Monday: ["nurture", "sensitivity"], // peaceful, calm
  Tuesday: ["sensitivity", "service"], // compassionate (the ocean)
  Wednesday: ["communication", "play"], // quick, heroic (Ananse the trickster)
  Thursday: ["discipline", "sovereignty"], // brave, protective (the earth)
  Friday: ["exploration", "nurture"], // adventurous, nurturing (fertility)
  Saturday: ["vision", "analysis"], // wise, an old soul (the ancient)
};

/** Birth weekday to the life area its character most naturally lands in. */
const DAY_DOMAIN: Record<string, string> = {
  Sunday: "community",
  Monday: "home",
  Tuesday: "service-health",
  Wednesday: "communication",
  Thursday: "self",
  Friday: "creativity",
  Saturday: "philosophy",
};

export const adapter: SemanticAdapter = {
  systemId: meta.id,
  ontologyVersion: ONTOLOGY_VERSION,
  toPrimitives(native: NativeResult): Primitive[] {
    const factor = native.factors["day-name"];
    if (!factor) return [];
    const { day } = factor.value as { day: string };

    const primitives: Primitive[] = [];
    const base = {
      source: meta.id,
      derivedFrom: "date" as const,
      native: { factorKey: "day-name", raw: day },
    };

    const themes = DAY_THEME[day] ?? [];
    themes.forEach((value, i) => {
      if (isRegistered("theme", value)) {
        primitives.push({ axis: "theme", value, weight: i === 0 ? 0.5 : 0.3, ...base });
      }
    });

    const domain = DAY_DOMAIN[day];
    if (domain && isRegistered("domain", domain)) {
      primitives.push({ axis: "domain", value: domain, weight: 0.35, ...base });
    }

    const element = native.factors.element?.value as string | undefined;
    if (element) {
      const value = elementTerm("western", element);
      if (isRegistered("element", value)) {
        primitives.push({
          axis: "element",
          value,
          weight: 0.35,
          source: meta.id,
          derivedFrom: "date",
          native: { factorKey: "element", raw: element },
        });
      }
    }

    const polarity = native.factors.polarity?.value as string | undefined;
    if (polarity && isRegistered("polarity", polarity)) {
      primitives.push({
        axis: "polarity",
        value: polarity,
        weight: 0.4,
        source: meta.id,
        derivedFrom: "date",
        native: { factorKey: "polarity", raw: polarity },
      });
    }

    return primitives;
  },
};
