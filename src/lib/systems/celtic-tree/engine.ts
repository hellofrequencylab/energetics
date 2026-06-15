import type { BirthEvent } from "@/lib/core/birth-event";
import type { NativeResult, SystemEngine, SystemMeta } from "@/lib/core/contracts";
import { dateParts } from "@/lib/core/time";

export const meta: SystemMeta = {
  id: "celtic-tree",
  displayName: "Celtic Tree Astrology",
  lineage: "modern-reconstruction",
  requires: { time: false, place: false },
  derivedFrom: "date",
  dependsOn: [],
  corpusVersion: "2",
};

type TreeElement = "fire" | "earth" | "air" | "water";
type TreePolarity = "active" | "receptive" | "balanced";

// The 13 tree-months of the popular Ogham calendar (a 20th-c. reconstruction).
// [startMD, endMD] as month*100+day; Birch wraps the year boundary.
//
// Each tree carries its Ogham letter name (the Old Irish few, public-domain), a
// classical element and an active/receptive polarity. Elements and polarities are
// our own plain reading of each tree's nature, not a single canonical source, so
// they take part in the synthesis at a modest weight that respects the lineage.
const TREES: {
  tree: string;
  ogham: string;
  start: number;
  end: number;
  keyword: string;
  element: TreeElement;
  polarity: TreePolarity;
}[] = [
  { tree: "Birch", ogham: "Beith", start: 1224, end: 120, keyword: "new beginnings", element: "air", polarity: "active" },
  { tree: "Rowan", ogham: "Luis", start: 121, end: 217, keyword: "vision and protection", element: "fire", polarity: "active" },
  { tree: "Ash", ogham: "Nion", start: 218, end: 317, keyword: "connection and flow", element: "water", polarity: "receptive" },
  { tree: "Alder", ogham: "Fearn", start: 318, end: 414, keyword: "courage and guidance", element: "fire", polarity: "active" },
  { tree: "Willow", ogham: "Saille", start: 415, end: 512, keyword: "intuition and feeling", element: "water", polarity: "receptive" },
  { tree: "Hawthorn", ogham: "Huath", start: 513, end: 609, keyword: "balance amid contradiction", element: "fire", polarity: "balanced" },
  { tree: "Oak", ogham: "Duir", start: 610, end: 707, keyword: "strength and endurance", element: "earth", polarity: "active" },
  { tree: "Holly", ogham: "Tinne", start: 708, end: 804, keyword: "nobility and challenge", element: "fire", polarity: "active" },
  { tree: "Hazel", ogham: "Coll", start: 805, end: 901, keyword: "wisdom and knowledge", element: "air", polarity: "receptive" },
  { tree: "Vine", ogham: "Muin", start: 902, end: 929, keyword: "sensitivity and discernment", element: "water", polarity: "balanced" },
  { tree: "Ivy", ogham: "Gort", start: 930, end: 1027, keyword: "persistence and devotion", element: "earth", polarity: "receptive" },
  { tree: "Reed", ogham: "Ngetal", start: 1028, end: 1124, keyword: "depth and meaning", element: "water", polarity: "receptive" },
  { tree: "Elder", ogham: "Ruis", start: 1125, end: 1223, keyword: "change and renewal", element: "earth", polarity: "balanced" },
];

/**
 * The Celtic year splits at the solstices into a waxing light half (Yule to
 * midsummer) and a waning dark half. The half a tree sits in adds a broad
 * orientation: the light half toward growing and reaching, the dark half toward
 * deepening and consolidating. Returns "light" or "dark" from the start date.
 */
function yearHalf(startMD: number): "light" | "dark" {
  // Light half runs from the winter solstice tree (Birch, Dec 24) through Oak's
  // start (Jun 10). Months June 10 onward to the Birch wrap are the dark half.
  // Encode by month*100+day windows: 1224..1231 and 101..609 are light.
  if (startMD >= 1224 || startMD <= 609) return "light";
  return "dark";
}

export const engine: SystemEngine = {
  meta,
  compute(birth: BirthEvent): NativeResult {
    const { month, day } = dateParts(birth);
    const md = month * 100 + day;
    const t =
      TREES.find((r) => (r.start <= r.end ? md >= r.start && md <= r.end : md >= r.start || md <= r.end)) ?? TREES[0];

    const half = yearHalf(t.start);

    return {
      systemId: meta.id,
      factors: {
        tree: {
          key: "tree",
          label: "Tree",
          value: { tree: t.tree, keyword: t.keyword, element: t.element, polarity: t.polarity },
          display: `${t.tree}: ${t.keyword}`,
        },
        ogham: {
          key: "ogham",
          label: "Ogham Few",
          value: { ogham: t.ogham, tree: t.tree },
          display: `${t.ogham} (${t.tree})`,
        },
        element: {
          key: "element",
          label: "Element",
          value: t.element,
          display: t.element.charAt(0).toUpperCase() + t.element.slice(1),
        },
        polarity: {
          key: "polarity",
          label: "Polarity",
          value: t.polarity,
          display:
            t.polarity === "active"
              ? "Active, reaching"
              : t.polarity === "receptive"
                ? "Receptive, deepening"
                : "Balanced",
        },
        "year-half": {
          key: "year-half",
          label: "Year Half",
          value: half,
          display: half === "light" ? "Light half, waxing" : "Dark half, waning",
        },
      },
    };
  },
};
