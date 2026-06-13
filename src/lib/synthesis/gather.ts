import type { Primitive } from "@/lib/core/contracts";
import type { ComputedSystem } from "./types";

/** Collect all primitives from every computed system for a birth event (spec §7.1). */
export function gather(computations: ComputedSystem[]): Primitive[] {
  return computations.flatMap((c) => c.primitives);
}
