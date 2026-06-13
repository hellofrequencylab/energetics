import type { SystemMeta } from "@/lib/core/contracts";
import { ONTOLOGY_VERSION } from "@/lib/ontology/version";
import { stubAdapter, stubEngine } from "../stub";

/**
 * Egyptian Decans — SCAFFOLD (Phase 3).
 * The 36 decans (10° divisions of the ecliptic). Ephemeris-derived (Sun's decan)
 * but date-precision sufficient; place optional.
 */
export const meta: SystemMeta = {
  id: "egyptian-decans",
  displayName: "Egyptian Decans",
  lineage: "traditional",
  requires: { time: false, place: false },
  derivedFrom: "ephemeris",
  dependsOn: [],
  corpusVersion: "0",
};

export const engine = stubEngine(meta);
export const adapter = stubAdapter(meta, ONTOLOGY_VERSION);
