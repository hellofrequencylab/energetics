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

/**
 * Ten Gods (十神) → life domain. The classic gods group into peer, output,
 * wealth, authority, and resource families, which map cleanly to ontology
 * domains: peers → community, output → creativity, wealth → resources,
 * authority → vocation, resource → philosophy (study and support).
 */
const GOD_DOMAIN: Record<string, string> = {
  Friend: "community",
  "Rob Wealth": "community",
  "Eating God": "creativity",
  "Hurting Officer": "creativity",
  "Direct Wealth": "resources",
  "Indirect Wealth": "resources",
  "Direct Officer": "vocation",
  "Seven Killings": "vocation",
  "Direct Resource": "philosophy",
  "Indirect Resource": "philosophy",
};

/** Ten Gods → curated theme, naming the working force each god brings. */
const GOD_THEME: Record<string, string> = {
  "Eating God": "play",
  "Hurting Officer": "communication",
  "Direct Wealth": "discipline",
  "Indirect Wealth": "exploration",
  "Direct Officer": "structure",
  "Seven Killings": "leadership",
  "Direct Resource": "nurture",
  "Indirect Resource": "intuition",
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

    // Ten Gods → domain + theme. The month and hour gods carry the strongest read
    // on what arena of life a chart leans into (career, study, output, peers).
    const tenGods = native.factors["ten-gods"];
    if (tenGods) {
      const gods = tenGods.value as Record<string, string>;
      const seenDomains = new Set<string>();
      const seenThemes = new Set<string>();
      // Month god leads (the season root), then hour, then year.
      for (const [slot, weight] of [["month", 0.6], ["hour", 0.45], ["year", 0.35]] as const) {
        const god = gods[slot];
        if (!god) continue;
        const domain = GOD_DOMAIN[god];
        if (domain && !seenDomains.has(domain)) {
          seenDomains.add(domain);
          primitives.push({
            axis: "domain",
            value: domain,
            weight,
            source: meta.id,
            derivedFrom: "date",
            native: { factorKey: "ten-gods", raw: { slot, god } },
          });
        }
        const theme = GOD_THEME[god];
        if (theme && !seenThemes.has(theme)) {
          seenThemes.add(theme);
          primitives.push({
            axis: "theme",
            value: theme,
            weight: weight * 0.8,
            source: meta.id,
            derivedFrom: "date",
            native: { factorKey: "ten-gods", raw: { slot, god } },
          });
        }
      }
    }

    // Day Master strength → polarity. A well-rooted day master tends to initiate
    // (active); a supported one tends to gather and respond (receptive). Lighter
    // weight than the day-stem polarity above, since it is a derived strength read.
    const strength = native.factors.strength;
    if (strength) {
      const { rooting } = strength.value as { rooting: string };
      if (rooting) {
        primitives.push({
          axis: "polarity",
          value: rooting === "strong" ? "active" : "receptive",
          weight: 0.35,
          source: meta.id,
          derivedFrom: "date",
          native: { factorKey: "strength", raw: rooting },
        });
      }
    }

    // NaYin element of the day pillar, an independent older element read of the
    // day. Light weight, it backs the day-master element family.
    const nayin = native.factors.nayin;
    if (nayin) {
      const { element } = nayin.value as { element: string };
      if (element) {
        primitives.push({
          axis: "element",
          value: `chinese:${element}`,
          weight: 0.3,
          source: meta.id,
          derivedFrom: "date",
          native: { factorKey: "nayin", raw: element },
        });
      }
    }

    // Useful Element, the phase the chart most wants more of. It points to a
    // growth direction, so it earns its own element signal with a self-aware
    // theme (the quality you are reaching toward).
    const useful = native.factors["useful-element"];
    if (useful) {
      const { element } = useful.value as { element: string };
      if (element) {
        primitives.push({
          axis: "element",
          value: `chinese:${element}`,
          weight: 0.4,
          source: meta.id,
          derivedFrom: "date",
          native: { factorKey: "useful-element", raw: element },
        });
        const theme = ELEMENT_THEME[element];
        if (theme) {
          primitives.push({
            axis: "theme",
            value: theme,
            weight: 0.3,
            source: meta.id,
            derivedFrom: "date",
            native: { factorKey: "useful-element", raw: element },
          });
        }
      }
    }

    return primitives;
  },
};
