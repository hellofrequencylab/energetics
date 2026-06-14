import { ONTOLOGY_VERSION } from "@/lib/ontology/version";
import { inSynthesisFor } from "@/lib/core/catalog";
import { gather } from "./gather";
import { cluster } from "./cluster";
import { weighCluster } from "./weight";
import { findTensions } from "./tension";
import { rankConvergences } from "./rank";
import type { ComputedSystem, Synthesis } from "./types";

/**
 * Run the deterministic synthesis pipeline: gather → cluster → weight → tension
 * → rank. Reads ONLY primitives + provenance; re-computes nothing. No LLM, no
 * embeddings (spec §1.6, §9).
 */
export function synthesize(birthEventId: string, computations: ComputedSystem[]): Synthesis {
  // Some systems are shown but kept out of the synthesis by design (Dreamspell).
  const primitives = gather(computations.filter((c) => inSynthesisFor(c.meta.id)));
  const clusters = cluster(primitives);
  const convergences = rankConvergences(clusters.map(weighCluster));
  const tensions = findTensions(clusters);

  return {
    birthEventId,
    ontologyVersion: ONTOLOGY_VERSION,
    convergences,
    tensions,
  };
}

export type { Synthesis, Convergence, Tension, Attribution, ComputedSystem } from "./types";
