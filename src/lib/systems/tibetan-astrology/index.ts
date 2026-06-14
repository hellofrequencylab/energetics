import type { SystemMeta } from "@/lib/core/contracts";
import { ONTOLOGY_VERSION } from "@/lib/ontology/version";
import { stubAdapter, stubEngine } from "../stub";

/**
 * Tibetan astrology. Registered scaffold (returns {} until built). The birth
 * year animal and element, the parkha, and the mewa are read from the Tibetan
 * calendar date, so the primary source is the date.
 */
export const meta: SystemMeta = {
  id: "tibetan-astrology",
  displayName: "Tibetan Astrology",
  lineage: "traditional",
  requires: { time: false, place: false },
  derivedFrom: "date",
  dependsOn: [],
  corpusVersion: "0",
};

export const engine = stubEngine(meta);
export const adapter = stubAdapter(meta, ONTOLOGY_VERSION);
