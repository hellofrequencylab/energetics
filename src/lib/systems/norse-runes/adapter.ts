import { ONTOLOGY_VERSION } from "@/lib/ontology/version";
import { stubAdapter } from "../stub";
import { meta } from "./engine";

// Modern reconstruction → informational only; no structural-synthesis primitives.
export const adapter = stubAdapter(meta, ONTOLOGY_VERSION);
