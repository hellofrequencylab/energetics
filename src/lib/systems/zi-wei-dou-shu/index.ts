import type { SystemMeta } from "@/lib/core/contracts";
import { ONTOLOGY_VERSION } from "@/lib/ontology/version";
import { stubAdapter, stubEngine } from "../stub";

/**
 * Zi Wei Dou Shu (Purple Star Astrology) — SCAFFOLD (Phase 3).
 * Chinese palace-based system built from the lunar calendar + birth hour.
 */
export const meta: SystemMeta = {
  id: "zi-wei-dou-shu",
  displayName: "Zi Wei Dou Shu",
  lineage: "traditional",
  requires: { time: true, place: false },
  derivedFrom: "date",
  dependsOn: [],
  corpusVersion: "0",
};

export const engine = stubEngine(meta);
export const adapter = stubAdapter(meta, ONTOLOGY_VERSION);
