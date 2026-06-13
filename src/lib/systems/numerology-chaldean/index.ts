import type { SystemMeta } from "@/lib/core/contracts";
import { ONTOLOGY_VERSION } from "@/lib/ontology/version";
import { stubAdapter, stubEngine } from "../stub";

/**
 * Chaldean Numerology — SCAFFOLD (Phase 2).
 * Name-derived (different letter→number values than Pythagorean). The only
 * `name`-sourced system in v1, so it forms its own independence group — genuine
 * cross-source confirmation when it agrees with ephemeris/date systems.
 */
export const meta: SystemMeta = {
  id: "numerology-chaldean",
  displayName: "Numerology (Chaldean)",
  lineage: "traditional",
  requires: { time: false, place: false },
  derivedFrom: "name",
  dependsOn: [],
  corpusVersion: "0",
};

export const engine = stubEngine(meta);
export const adapter = stubAdapter(meta, ONTOLOGY_VERSION);
