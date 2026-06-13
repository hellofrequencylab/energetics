import type { SystemMeta } from "@/lib/core/contracts";
import { ONTOLOGY_VERSION } from "@/lib/ontology/version";
import { stubAdapter, stubEngine } from "../stub";

/**
 * Nine Star Ki — SCAFFOLD (Phase 3).
 * Japanese system from the Chinese Lo Shu / five elements; principal/character/
 * energetic stars from the birth year and month.
 */
export const meta: SystemMeta = {
  id: "nine-star-ki",
  displayName: "Nine Star Ki",
  lineage: "traditional",
  requires: { time: false, place: false },
  derivedFrom: "date",
  dependsOn: [],
  corpusVersion: "0",
};

export const engine = stubEngine(meta);
export const adapter = stubAdapter(meta, ONTOLOGY_VERSION);
