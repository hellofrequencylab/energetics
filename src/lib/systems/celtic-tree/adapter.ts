import type { NativeResult, Primitive, SemanticAdapter } from "@/lib/core/contracts";
import { elementTerm, isRegistered } from "@/lib/ontology/axes";
import { ONTOLOGY_VERSION } from "@/lib/ontology/version";
import { meta } from "./engine";

/**
 * Birth tree to ontology themes (registered in THEMES). Our own plain reading of
 * each tree's keyword, so the Ogham tree calendar takes part in the synthesis as a
 * date-derived voice. A modern reconstruction, so it carries a modest weight.
 */
const TREE_THEME: Record<string, string[]> = {
  Birch: ["exploration"],
  Rowan: ["vision", "nurture"],
  Ash: ["communication"],
  Alder: ["leadership"],
  Willow: ["intuition", "sensitivity"],
  Hawthorn: ["analysis"],
  Oak: ["discipline", "sovereignty"],
  Holly: ["sovereignty"],
  Hazel: ["analysis"],
  Vine: ["sensitivity"],
  Ivy: ["devotion"],
  Reed: ["vision"],
  Elder: ["transformation"],
};

/** Birth tree to the life area it most naturally lands in (registered DOMAINS). */
const TREE_DOMAIN: Record<string, string> = {
  Birch: "self",
  Rowan: "spirituality",
  Ash: "communication",
  Alder: "vocation",
  Willow: "home",
  Hawthorn: "relationship",
  Oak: "self",
  Holly: "vocation",
  Hazel: "philosophy",
  Vine: "creativity",
  Ivy: "relationship",
  Reed: "spirituality",
  Elder: "transformation",
};

export const adapter: SemanticAdapter = {
  systemId: meta.id,
  ontologyVersion: ONTOLOGY_VERSION,
  toPrimitives(native: NativeResult): Primitive[] {
    const treeValue = native.factors.tree?.value as
      | { tree?: string; element?: string; polarity?: string }
      | undefined;
    const tree = treeValue?.tree;
    if (!tree) return [];

    const primitives: Primitive[] = [];
    const base = {
      source: meta.id,
      derivedFrom: "date" as const,
      native: { factorKey: "tree", raw: tree },
    };

    for (const value of TREE_THEME[tree] ?? []) {
      if (isRegistered("theme", value)) {
        primitives.push({ axis: "theme", value, weight: 0.45, ...base });
      }
    }

    const domain = TREE_DOMAIN[tree];
    if (domain && isRegistered("domain", domain)) {
      primitives.push({ axis: "domain", value: domain, weight: 0.35, ...base });
    }

    if (treeValue?.element) {
      const value = elementTerm("western", treeValue.element);
      if (isRegistered("element", value)) {
        primitives.push({ axis: "element", value, weight: 0.4, ...base });
      }
    }

    if (treeValue?.polarity && isRegistered("polarity", treeValue.polarity)) {
      primitives.push({ axis: "polarity", value: treeValue.polarity, weight: 0.4, ...base });
    }

    // The light/dark half of the year nudges polarity once more, lightly: the
    // waxing light half reads active, the waning dark half receptive.
    const half = native.factors["year-half"]?.value as string | undefined;
    if (half) {
      const value = half === "light" ? "active" : "receptive";
      if (isRegistered("polarity", value)) {
        primitives.push({
          axis: "polarity",
          value,
          weight: 0.25,
          source: meta.id,
          derivedFrom: "date",
          native: { factorKey: "year-half", raw: half },
        });
      }
    }

    return primitives;
  },
};
