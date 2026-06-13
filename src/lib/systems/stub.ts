import type { SemanticAdapter, SystemEngine, SystemMeta } from "@/lib/core/contracts";

/**
 * Helpers for registered-but-unbuilt systems. The spec requires every system to
 * be registered up front and to ship as a stub returning `{}` factors until
 * built — the synthesis pipeline handles empty native results gracefully.
 */
export function stubEngine(meta: SystemMeta): SystemEngine {
  return { meta, compute: () => ({ systemId: meta.id, factors: {} }) };
}

export function stubAdapter(meta: SystemMeta, ontologyVersion: string): SemanticAdapter {
  return { systemId: meta.id, ontologyVersion, toPrimitives: () => [] };
}
