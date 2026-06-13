import type { SystemMeta } from "@/lib/core/contracts";
import { ONTOLOGY_VERSION } from "@/lib/ontology/version";
import { stubAdapter, stubEngine } from "../stub";

/**
 * Mahabote — SCAFFOLD (Phase 3).
 * Burmese system using the weekday of birth and remainders to place planetary
 * houses (Binga, Ahta, ...).
 */
export const meta: SystemMeta = {
  id: "mahabote",
  displayName: "Mahabote (Burmese)",
  lineage: "traditional",
  requires: { time: false, place: false },
  derivedFrom: "date",
  dependsOn: [],
  corpusVersion: "0",
};

export const engine = stubEngine(meta);
export const adapter = stubAdapter(meta, ONTOLOGY_VERSION);
