import type { BirthEvent } from "@/lib/core/birth-event";
import type { SystemMeta } from "@/lib/core/contracts";
import type { NarrativeResult } from "@/lib/synthesis/narrative";
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

/** Response shape of POST /api/charts/narrate. */
export interface NarrateResponse {
  narrative: NarrativeResult;
}
