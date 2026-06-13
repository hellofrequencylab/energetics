import { ONTOLOGY_VERSION } from "@/lib/ontology/version";
import { stubAdapter } from "../stub";
import { meta } from "./engine";

// Modern reconstruction → shown informationally; no structural-synthesis
// primitives (consistent with Dreamspell — lineage labeled, not laundered).
export const adapter = stubAdapter(meta, ONTOLOGY_VERSION);
