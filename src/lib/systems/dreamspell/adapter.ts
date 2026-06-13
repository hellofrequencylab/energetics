import { ONTOLOGY_VERSION } from "@/lib/ontology/version";
import { stubAdapter } from "../stub";
import { meta } from "./engine";

/**
 * Intentionally emits NO primitives. A modern-reconstruction with a non-standard
 * correlation is shown informationally and excluded from structural synthesis
 * weighting (spec §1.8 — lineage is labeled, not laundered).
 */
export const adapter = stubAdapter(meta, ONTOLOGY_VERSION);
