import type { SystemMeta } from "@/lib/core/contracts";
import { ONTOLOGY_VERSION } from "@/lib/ontology/version";
import { stubAdapter, stubEngine } from "../stub";

/**
 * Akan Day Names (Kra Din) — SCAFFOLD (Phase 3).
 * West African (Akan) soul-name from the weekday of birth, each carrying a
 * traditional character archetype.
 */
export const meta: SystemMeta = {
  id: "akan-day-names",
  displayName: "Akan Day Names",
  lineage: "traditional",
  requires: { time: false, place: false },
  derivedFrom: "date",
  dependsOn: [],
  corpusVersion: "0",
};

export const engine = stubEngine(meta);
export const adapter = stubAdapter(meta, ONTOLOGY_VERSION);
