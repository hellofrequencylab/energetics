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
  corpusVersion: "1",
};

// The 13 tree-months of the popular Ogham calendar (a 20th-c. reconstruction).
// [startMD, endMD] as month*100+day; Birch wraps the year boundary.
const TREES: { tree: string; start: number; end: number; keyword: string }[] = [
  { tree: "Birch", start: 1224, end: 120, keyword: "new beginnings" },
  { tree: "Rowan", start: 121, end: 217, keyword: "vision and protection" },
  { tree: "Ash", start: 218, end: 317, keyword: "connection and flow" },
  { tree: "Alder", start: 318, end: 414, keyword: "courage and guidance" },
  { tree: "Willow", start: 415, end: 512, keyword: "intuition and feeling" },
  { tree: "Hawthorn", start: 513, end: 609, keyword: "balance amid contradiction" },
  { tree: "Oak", start: 610, end: 707, keyword: "strength and endurance" },
  { tree: "Holly", start: 708, end: 804, keyword: "nobility and challenge" },
  { tree: "Hazel", start: 805, end: 901, keyword: "wisdom and knowledge" },
  { tree: "Vine", start: 902, end: 929, keyword: "sensitivity and discernment" },
  { tree: "Ivy", start: 930, end: 1027, keyword: "persistence and devotion" },
  { tree: "Reed", start: 1028, end: 1124, keyword: "depth and meaning" },
  { tree: "Elder", start: 1125, end: 1223, keyword: "change and renewal" },
];

export const engine: SystemEngine = {
  meta,
  compute(birth: BirthEvent): NativeResult {
    const { month, day } = dateParts(birth);
    const md = month * 100 + day;
    const t =
      TREES.find((r) => (r.start <= r.end ? md >= r.start && md <= r.end : md >= r.start || md <= r.end)) ?? TREES[0];

    return {
      systemId: meta.id,
      factors: {
        tree: { key: "tree", label: "Tree", value: { tree: t.tree, keyword: t.keyword }, display: `${t.tree} — ${t.keyword}` },
      },
    };
  },
};
