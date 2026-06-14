import type { NativeResult, Primitive, SemanticAdapter } from "@/lib/core/contracts";
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

export const adapter: SemanticAdapter = {
  systemId: meta.id,
  ontologyVersion: ONTOLOGY_VERSION,
  toPrimitives(native: NativeResult): Primitive[] {
    const tree = (native.factors.tree?.value as { tree?: string } | undefined)?.tree;
    if (!tree) return [];
    return (TREE_THEME[tree] ?? []).map((value) => ({
      axis: "theme",
      value,
      weight: 0.45,
      source: meta.id,
      derivedFrom: "date",
      native: { factorKey: "tree", raw: tree },
    }));
  },
};
