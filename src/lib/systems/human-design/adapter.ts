import { ONTOLOGY_VERSION } from "@/lib/ontology/version";
import { stubAdapter } from "../stub";
import { meta } from "./engine";

// No primitives until the BodyGraph is computed (see engine.ts). The `center`
// axis will be this system's primary contribution once built.
export const adapter = stubAdapter(meta, ONTOLOGY_VERSION);
