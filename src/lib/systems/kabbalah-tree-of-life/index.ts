import type { SystemMeta } from "@/lib/core/contracts";
import { ONTOLOGY_VERSION } from "@/lib/ontology/version";
import { stubAdapter, stubEngine } from "../stub";

/**
 * Kabbalah, Tree of Life with gematria. Registered scaffold (returns {} until
 * built). Gematria of the name places letters on the paths and sephirot, so the
 * primary source is the name.
 */
export const meta: SystemMeta = {
  id: "kabbalah-tree-of-life",
  displayName: "Kabbalah · Tree of Life",
  lineage: "traditional",
  requires: { time: false, place: false },
  derivedFrom: "name",
  dependsOn: [],
  corpusVersion: "0",
};

export const engine = stubEngine(meta);
export const adapter = stubAdapter(meta, ONTOLOGY_VERSION);
