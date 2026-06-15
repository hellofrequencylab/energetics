import type { NativeResult, Primitive, SemanticAdapter } from "@/lib/core/contracts";
import { ONTOLOGY_VERSION } from "@/lib/ontology/version";
import { meta } from "./engine";

/**
 * Zi Wei Dou Shu adapter. The 紫微 + 14-major-star placement is still validation-
 * pending, so we emit NOTHING from the star positions: those are kept out of
 * synthesis until confirmed against a trusted calculator. We DO emit from the
 * confidently-computed frame, the parts of the chart that are well defined
 * regardless of the star layout:
 *  - the Five Elements Bureau element (the chart's elemental ground)
 *  - the Life Palace branch element (the seat of the self palace)
 *  - the Life Palace branch animal (its shared temperament reading)
 *  - the year-stem polarity (yang/yin charge of the chart)
 * These carry modest weights, reflecting that they are the frame rather than the
 * full star reading.
 */

const ELEMENT_THEME: Record<string, string> = {
  wood: "vision",
  fire: "leadership",
  earth: "nurture",
  metal: "structure",
  water: "intuition",
};

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

    // Five Elements Bureau element: the chart's elemental ground.
    const bureau = native.factors.bureau;
    if (bureau) {
      const { element } = bureau.value as { element?: string };
      if (element) {
        primitives.push({
          axis: "element",
          value: `chinese:${element}`,
          weight: 0.55,
          source: meta.id,
          derivedFrom: "date",
          native: { factorKey: "bureau", raw: element },
        });
        const theme = ELEMENT_THEME[element];
        if (theme) {
          primitives.push({
            axis: "theme",
            value: theme,
            weight: 0.4,
            source: meta.id,
            derivedFrom: "date",
            native: { factorKey: "bureau", raw: element },
          });
        }
      }
    }

    // Life Palace branch: element of the self palace + its animal temperament, and
    // a self-domain emphasis (the Life Palace is the palace of the self).
    const life = native.factors["life-palace"];
    if (life) {
      const { element, animal } = life.value as { element?: string; animal?: string };
      if (element) {
        primitives.push({
          axis: "element",
          value: `chinese:${element}`,
          weight: 0.4,
          source: meta.id,
          derivedFrom: "date",
          native: { factorKey: "life-palace", raw: element },
        });
      }
      if (animal) {
        const theme = ANIMAL_THEME[animal];
        if (theme) {
          primitives.push({
            axis: "theme",
            value: theme,
            weight: 0.4,
            source: meta.id,
            derivedFrom: "date",
            native: { factorKey: "life-palace", raw: animal },
          });
        }
      }
      primitives.push({
        axis: "domain",
        value: "self",
        weight: 0.35,
        source: meta.id,
        derivedFrom: "date",
        native: { factorKey: "life-palace", raw: (life.value as { branch?: string }).branch },
      });
    }

    // Year-stem polarity: the yang/yin charge of the chart.
    const polarity = native.factors.polarity;
    if (polarity) {
      const { polarity: pol } = polarity.value as { polarity?: string };
      if (pol) {
        primitives.push({
          axis: "polarity",
          value: pol === "Yang" ? "active" : "receptive",
          weight: 0.4,
          source: meta.id,
          derivedFrom: "date",
          native: { factorKey: "polarity", raw: pol },
        });
      }
    }

    return primitives;
  },
};
