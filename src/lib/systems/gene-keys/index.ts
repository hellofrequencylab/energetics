import type { SystemMeta } from "@/lib/core/contracts";
import { ONTOLOGY_VERSION } from "@/lib/ontology/version";
import { stubAdapter, stubEngine } from "../stub";

/**
 * Gene Keys — SCAFFOLD. Reuses the Human Design gate computation (the 64 gates /
 * Rave mandala), so `dependsOn: ["human-design"]` is a HARD derivation
 * dependency: synthesis must treat the two as fully correlated, never as
 * independent corroboration. Built after Human Design lands.
 */
export const meta: SystemMeta = {
  id: "gene-keys",
  displayName: "Gene Keys",
  lineage: "hybrid",
  requires: { time: true, place: true },
  derivedFrom: "ephemeris",
  dependsOn: ["human-design"],
  corpusVersion: "0",
};

export const engine = stubEngine(meta);
export const adapter = stubAdapter(meta, ONTOLOGY_VERSION);
