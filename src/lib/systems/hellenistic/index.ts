import type { SystemMeta } from "@/lib/core/contracts";
import { ONTOLOGY_VERSION } from "@/lib/ontology/version";
import { stubAdapter, stubEngine } from "../stub";

/**
 * Hellenistic Astrology — SCAFFOLD (Phase 3).
 * Ancient Greek astrology (sect, lots, whole-sign houses, time-lord systems).
 * `dependsOn: ["western-tropical"]` — shares the same ephemeris computation and
 * may ultimately be implemented as a *mode* of western-tropical (spec §5 †),
 * so synthesis must treat their agreement as one ephemeris voice.
 */
export const meta: SystemMeta = {
  id: "hellenistic",
  displayName: "Hellenistic Astrology",
  lineage: "traditional",
  requires: { time: true, place: true },
  derivedFrom: "ephemeris",
  dependsOn: ["western-tropical"],
  corpusVersion: "0",
};

export const engine = stubEngine(meta);
export const adapter = stubAdapter(meta, ONTOLOGY_VERSION);
