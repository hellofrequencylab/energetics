import type { BirthEvent } from "@/lib/core/birth-event";
import type { NativeResult, SystemEngine, SystemMeta } from "@/lib/core/contracts";
import { dateParts } from "@/lib/core/time";

export const meta: SystemMeta = {
  id: "numerology-pythagorean",
  displayName: "Numerology (Pythagorean)",
  lineage: "traditional",
  requires: { time: false, place: false },
  derivedFrom: "date",
  dependsOn: [],
  corpusVersion: "1",
};

/** Reduce to a single digit, preserving master numbers 11/22/33. */
export function reduce(n: number): number {
  const masters = new Set([11, 22, 33]);
  let value = n;
  while (value > 9 && !masters.has(value)) {
    value = String(value)
      .split("")
      .reduce((sum, d) => sum + Number(d), 0);
  }
  return value;
}

/** Phase 1 minimal output: Life Path. Pure function of the birth date. */
export const engine: SystemEngine = {
  meta,
  compute(birth: BirthEvent): NativeResult {
    const { year, month, day } = dateParts(birth);
    const lifePath = reduce(reduce(year) + reduce(month) + reduce(day));
    return {
      systemId: meta.id,
      factors: {
        "life-path": { key: "life-path", label: "Life Path", value: lifePath, display: String(lifePath) },
      },
    };
  },
};
