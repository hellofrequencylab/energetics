import { ONTOLOGY_VERSION } from "@/lib/ontology/version";
import { stubAdapter } from "../stub";
import { meta } from "./engine";

/**
 * No ontology primitives in v1: Gene Keys' interpretive substance is the licensed
 * per-gate corpus we don't reproduce, and its gates are hard-derived from Human
 * Design (same ephemeris group) — so the Activation Sequence is shown
 * informationally and left out of the structural synthesis.
 */
export const adapter = stubAdapter(meta, ONTOLOGY_VERSION);
