import type { BirthEvent } from "@/lib/core/birth-event";
import type { SystemMeta } from "@/lib/core/contracts";
import type { ComputedSystem, Synthesis } from "@/lib/synthesis/types";

/** Response shape of POST /api/charts/compute (consumed by the client). */
export interface ComputeResponse {
  event: BirthEvent;
  name?: string;
  computations: ComputedSystem[];
  unavailable: { meta: SystemMeta; reason: string }[];
  synthesis: Synthesis;
  ephemerisVersion: string;
}

// The narrate endpoints stream text/plain (see /api/charts/narrate and
// /api/synastry/narrate) with metadata in headers, so they have no JSON shape.
