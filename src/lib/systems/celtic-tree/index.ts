import type { SystemMeta } from "@/lib/core/contracts";
import { ONTOLOGY_VERSION } from "@/lib/ontology/version";
import { stubAdapter, stubEngine } from "../stub";

/**
 * Celtic Tree Astrology — SCAFFOLD (Phase 3), modern-reconstruction.
 * A 20th-century construction (Robert Graves' Ogham calendar) — labeled as such,
 * never presented as ancient Druidic fact.
 */
export const meta: SystemMeta = {
  id: "celtic-tree",
  displayName: "Celtic Tree Astrology",
  lineage: "modern-reconstruction",
  requires: { time: false, place: false },
  derivedFrom: "date",
  dependsOn: [],
  corpusVersion: "0",
};

export const engine = stubEngine(meta);
export const adapter = stubAdapter(meta, ONTOLOGY_VERSION);
