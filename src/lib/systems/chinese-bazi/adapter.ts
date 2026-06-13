import type { NativeResult, Primitive, SemanticAdapter } from "@/lib/core/contracts";
import { ONTOLOGY_VERSION } from "@/lib/ontology/version";
import { meta } from "./engine";

/** Animal → curated theme (registered in ontology THEMES). */
const ANIMAL_THEME: Record<string, string> = {
  Rat: "communication",
  Ox: "discipline",
  Tiger: "leadership",
  Rabbit: "sensitivity",
  Dragon: "sovereignty",
  Snake: "transformation",
  Horse: "exploration",
  Goat: "nurture",
  Monkey: "play",
  Rooster: "analysis",
  Dog: "devotion",
  Pig: "nurture",
};

export const adapter: SemanticAdapter = {
  systemId: meta.id,
  ontologyVersion: ONTOLOGY_VERSION,
  toPrimitives(native: NativeResult): Primitive[] {
    const primitives: Primitive[] = [];

    const dm = native.factors["day-master"];
    if (dm) {
      const { element, polarity } = dm.value as { element: string; polarity: string };
      if (element) {
        // Namespaced Chinese element — links to Western elements only via crosswalks.
        primitives.push({
          axis: "element",
          value: `chinese:${element}`,
          weight: 0.9,
          source: meta.id,
          derivedFrom: "date",
          native: { factorKey: "day-master", raw: dm.value },
        });
      }
      if (polarity) {
        primitives.push({
          axis: "polarity",
          value: polarity === "Yang" ? "active" : "receptive",
          weight: 0.7,
          source: meta.id,
          derivedFrom: "date",
          native: { factorKey: "day-master", raw: dm.value },
        });
      }
    }

    const animalFactor = native.factors.animal;
    if (animalFactor) {
      const { animal } = animalFactor.value as { animal: string };
      const theme = ANIMAL_THEME[animal];
      if (theme) {
        primitives.push({
          axis: "theme",
          value: theme,
          weight: 0.6,
          source: meta.id,
          derivedFrom: "date",
          native: { factorKey: "animal", raw: animal },
        });
      }
    }

    return primitives;
  },
};
