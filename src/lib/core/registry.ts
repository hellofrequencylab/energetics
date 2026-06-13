/**
 * The ONLY place systems are wired together (spec §4). Everything else
 * discovers systems through REGISTRY. Adding a system = add a folder + one line.
 *
 * Ordered by phase then source group. Real engines emit native output today;
 * the rest are registered scaffolds (corpusVersion "0") returning {} until built
 * — the synthesis pipeline handles empty native results gracefully.
 */
import type { Precision } from "./birth-event";
import type { RegisteredSystem, SystemMeta } from "./contracts";

// Phase 1 — real engines
import * as westernTropical from "@/lib/systems/western-tropical";
import * as numerologyPythagorean from "@/lib/systems/numerology-pythagorean";
import * as tzolkin from "@/lib/systems/tzolkin";
// Phase 2 — real engines (ahead of schedule; enrich the synthesis demo)
import * as vedicJyotish from "@/lib/systems/vedic-jyotish";
import * as chineseBazi from "@/lib/systems/chinese-bazi";

// Scaffolds (corpusVersion "0")
import * as humanDesign from "@/lib/systems/human-design";
import * as geneKeys from "@/lib/systems/gene-keys";
import * as hellenistic from "@/lib/systems/hellenistic";
import * as ziWeiDouShu from "@/lib/systems/zi-wei-dou-shu";
import * as dreamspell from "@/lib/systems/dreamspell";
import * as numerologyChaldean from "@/lib/systems/numerology-chaldean";
import * as tarotBirthCards from "@/lib/systems/tarot-birth-cards";
import * as nineStarKi from "@/lib/systems/nine-star-ki";
import * as celticTree from "@/lib/systems/celtic-tree";
import * as mahabote from "@/lib/systems/mahabote";
import * as akanDayNames from "@/lib/systems/akan-day-names";
import * as norseRunes from "@/lib/systems/norse-runes";
import * as egyptianDecans from "@/lib/systems/egyptian-decans";

const SYSTEM_MODULES = [
  westernTropical,
  vedicJyotish,
  hellenistic,
  chineseBazi,
  ziWeiDouShu,
  tzolkin,
  dreamspell,
  humanDesign,
  geneKeys,
  numerologyPythagorean,
  numerologyChaldean,
  tarotBirthCards,
  nineStarKi,
  celticTree,
  mahabote,
  akanDayNames,
  norseRunes,
  egyptianDecans,
];

export const REGISTRY: Record<string, RegisteredSystem> = Object.fromEntries(
  SYSTEM_MODULES.map((s) => [s.meta.id, { engine: s.engine, adapter: s.adapter, meta: s.meta }]),
);

export function allSystems(): RegisteredSystem[] {
  return Object.values(REGISTRY);
}

export function allMeta(): SystemMeta[] {
  return SYSTEM_MODULES.map((s) => s.meta);
}

export function getSystem(id: string): RegisteredSystem | undefined {
  return REGISTRY[id];
}

/** Systems whose data requirements are satisfied at the given precision. */
export function enginesFor(precision: Precision): SystemMeta[] {
  const hasTime = precision === "date-time" || precision === "date-time-place";
  const hasPlace = precision === "date-time-place";
  return allMeta().filter(
    (m) => (!m.requires.time || hasTime) && (!m.requires.place || hasPlace),
  );
}

/** Whether a system has a real engine yet (vs a registered scaffold). */
export function isBuilt(meta: SystemMeta): boolean {
  return meta.corpusVersion !== "0";
}
