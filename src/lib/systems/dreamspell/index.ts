import type { SystemMeta } from "@/lib/core/contracts";
import { ONTOLOGY_VERSION } from "@/lib/ontology/version";
import { stubAdapter, stubEngine } from "../stub";

/**
 * Dreamspell (Argüelles, 1987) — SCAFFOLD (Phase 3), modern-reconstruction.
 *
 * The verified calendrical core already exists in the Maya build (drop-in,
 * day-by-day validated). When wired, the engine emits the galactic signature +
 * Fifth-Force Oracle, but the adapter stays EMPTY: a modern reconstruction with
 * a leap-day-skipping correlation is shown informationally and excluded from
 * structural synthesis weighting (lineage must never be laundered, spec §1.8).
 */
export const meta: SystemMeta = {
  id: "dreamspell",
  displayName: "Dreamspell (Argüelles)",
  lineage: "modern-reconstruction",
  requires: { time: false, place: false },
  derivedFrom: "date",
  dependsOn: [],
  corpusVersion: "0",
};

export const engine = stubEngine(meta);
export const adapter = stubAdapter(meta, ONTOLOGY_VERSION);
