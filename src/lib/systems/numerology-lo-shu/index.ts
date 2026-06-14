import type { SystemMeta } from "@/lib/core/contracts";
import { ONTOLOGY_VERSION } from "@/lib/ontology/version";
import { stubAdapter, stubEngine } from "../stub";

/**
 * Lo Shu grid numerology (Vedic numerology). Registered scaffold (returns {}
 * until built). The grid is built from the digits of the birth date, so the
 * primary source is the date.
 */
export const meta: SystemMeta = {
  id: "numerology-lo-shu",
  displayName: "Lo Shu Grid Numerology",
  lineage: "traditional",
  requires: { time: false, place: false },
  derivedFrom: "date",
  dependsOn: [],
  corpusVersion: "0",
};

export const engine = stubEngine(meta);
export const adapter = stubAdapter(meta, ONTOLOGY_VERSION);
