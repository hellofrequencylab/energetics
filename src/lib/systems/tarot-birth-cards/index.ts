import type { SystemMeta } from "@/lib/core/contracts";
import { ONTOLOGY_VERSION } from "@/lib/ontology/version";
import { stubAdapter, stubEngine } from "../stub";

/**
 * Tarot Birth Cards — SCAFFOLD (Phase 2), hybrid.
 * Major-arcana cards derived by reducing the birth date. `dependsOn`
 * numerology-pythagorean is a hard derivation (same date-reduction), so
 * synthesis must treat the two as fully correlated, not independent.
 */
export const meta: SystemMeta = {
  id: "tarot-birth-cards",
  displayName: "Tarot Birth Cards",
  lineage: "hybrid",
  requires: { time: false, place: false },
  derivedFrom: "date",
  dependsOn: ["numerology-pythagorean"],
  corpusVersion: "0",
};

export const engine = stubEngine(meta);
export const adapter = stubAdapter(meta, ONTOLOGY_VERSION);
