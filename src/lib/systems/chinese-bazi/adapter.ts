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

/**
 * Five-phase element → curated theme (registered in ontology THEMES). Defensible
 * readings of each phase: wood grows and reaches outward, fire expresses and
 * inspires, earth holds and tends, metal refines and discerns, water flows and
 * senses beneath the surface.
 */
const ELEMENT_THEME: Record<string, string> = {
  wood: "vision",
  fire: "leadership",
  earth: "nurture",
  metal: "structure",
  water: "intuition",
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
        // Namespaced Chinese element, links to Western elements only via crosswalks.
        primitives.push({
          axis: "element",
          value: `chinese:${element}`,
          weight: 0.9,
          source: meta.id,
          derivedFrom: "date",
          native: { factorKey: "day-master", raw: dm.value },
        });
        // Day Master element → theme. The element of the day stem is the core of a
        // BaZi reading, so it earns a strong theme weight.
        const elementTheme = ELEMENT_THEME[element];
        if (elementTheme) {
          primitives.push({
            axis: "theme",
            value: elementTheme,
            weight: 0.8,
            source: meta.id,
            derivedFrom: "date",
            native: { factorKey: "day-master", raw: dm.value },
          });
        }
      }
      if (polarity) {
        // Yang → active, Yin → receptive.
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

    // Dominant element across the four pillars, a chart-wide element signal that
    // complements the single Day Master element above. Carries a lighter weight
    // since it is an aggregate rather than the core day stem.
    const elementsFactor = native.factors.elements;
    if (elementsFactor) {
      const { dominant } = elementsFactor.value as { dominant: string };
      if (dominant) {
        primitives.push({
          axis: "element",
          value: `chinese:${dominant}`,
          weight: 0.5,
          source: meta.id,
          derivedFrom: "date",
          native: { factorKey: "elements", raw: elementsFactor.value },
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
