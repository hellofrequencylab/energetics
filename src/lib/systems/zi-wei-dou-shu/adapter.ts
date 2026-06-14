import { ONTOLOGY_VERSION } from "@/lib/ontology/version";
import { stubAdapter } from "../stub";
import { meta } from "./engine";

/**
 * No structural-synthesis primitives while the star placement is validation-
 * pending — the Zi Wei chart is shown informationally so possibly-unverified
 * star positions never sway the cross-system convergence. Wire up emission once
 * the placement is confirmed against a trusted calculator.
 */
export const adapter = stubAdapter(meta, ONTOLOGY_VERSION);
