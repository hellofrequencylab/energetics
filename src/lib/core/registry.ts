/**
 * The ONLY place systems are wired together (spec §4). Everything else
 * discovers systems through REGISTRY. Adding a system = add a folder + one line.
 */
import * as westernTropical from "@/lib/systems/western-tropical";
import * as vedicJyotish from "@/lib/systems/vedic-jyotish";
import * as chineseBazi from "@/lib/systems/chinese-bazi";
import * as numerologyPythagorean from "@/lib/systems/numerology-pythagorean";
import * as tzolkin from "@/lib/systems/tzolkin";
import * as humanDesign from "@/lib/systems/human-design";
import * as geneKeys from "@/lib/systems/gene-keys";
import type { Precision } from "./birth-event";
import type { RegisteredSystem, SystemMeta } from "./contracts";

const SYSTEM_MODULES = [
  westernTropical,
  vedicJyotish,
  chineseBazi,
  numerologyPythagorean,
  tzolkin,
  humanDesign,
  geneKeys,
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
