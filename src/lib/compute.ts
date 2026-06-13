/**
 * Chart computation orchestrator (the Phase-0 "one API path end-to-end").
 *
 * For each system whose data requirements are satisfied: run the pure engine,
 * then the separate adapter. Engines that aren't satisfiable (or throw) are
 * reported as unavailable with a reason. NODE RUNTIME ONLY (loads the ephemeris).
 */
import type { BirthEvent } from "@/lib/core/birth-event";
import type { SystemMeta } from "@/lib/core/contracts";
import { getEphemeris } from "@/lib/core/ephemeris";
import { allMeta, enginesFor, getSystem } from "@/lib/core/registry";
import type { ComputedSystem } from "@/lib/synthesis/types";

export interface ChartComputation {
  computations: ComputedSystem[];
  unavailable: { meta: SystemMeta; reason: string }[];
  ephemerisVersion: string;
}

export function computeChart(birth: BirthEvent): ChartComputation {
  const ephemeris = getEphemeris();
  const satisfiable = new Set(enginesFor(birth.precision).map((m) => m.id));

  const computations: ComputedSystem[] = [];
  const unavailable: { meta: SystemMeta; reason: string }[] = [];

  for (const meta of allMeta()) {
    if (!satisfiable.has(meta.id)) {
      unavailable.push({ meta, reason: requirementReason(meta) });
      continue;
    }
    const system = getSystem(meta.id)!;
    try {
      const native = system.engine.compute(birth, { ephemeris });
      const primitives = system.adapter.toPrimitives(native);
      computations.push({ meta, native, primitives });
    } catch (err) {
      unavailable.push({ meta, reason: err instanceof Error ? err.message : "computation failed" });
    }
  }

  return { computations, unavailable, ephemerisVersion: ephemeris.version };
}

function requirementReason(meta: SystemMeta): string {
  const needs: string[] = [];
  if (meta.requires.time) needs.push("birth time");
  if (meta.requires.place) needs.push("birth place");
  return needs.length ? `Requires ${needs.join(" and ")}.` : "Not available at this precision.";
}
