import { allMeta } from "@/lib/core/registry";
import { declaredGroup } from "./independence";
import type { Attribution, Cluster, Convergence } from "./types";

/**
 * Source-aware independence weighting (spec §7.3) — the core of honest synthesis.
 *
 * Independence groups are computed by union-find over the registry: systems are
 * merged if they share a DECLARED independence group (see `independence.ts` —
 * systems that read the same signal or tradition) OR if one is in the other's
 * `dependsOn` closure (a hard derivation dependency). Within a group, weight
 * does NOT stack (we take the max — two zodiac systems agreeing is mostly one
 * signal in two outfits). Across independent groups, agreement is rewarded, and
 * the count of distinct groups is the primary ranking signal.
 */
let groupRootCache: Map<string, string> | null = null;

function groupRoots(): Map<string, string> {
  if (groupRootCache) return groupRootCache;
  const metas = allMeta();
  const parent = new Map<string, string>(metas.map((m) => [m.id, m.id]));
  const find = (v: string): string => {
    let r = v;
    while (parent.get(r) !== r) r = parent.get(r)!;
    return r;
  };
  const union = (a: string, b: string) => parent.set(find(a), find(b));

  // Union by declared independence group (systems that read the same signal).
  const byGroup = new Map<string, string[]>();
  for (const m of metas) {
    const g = declaredGroup(m.id);
    const list = byGroup.get(g) ?? [];
    list.push(m.id);
    byGroup.set(g, list);
  }
  for (const ids of byGroup.values()) for (let i = 1; i < ids.length; i++) union(ids[0], ids[i]);

  // Union by dependsOn closure (a hard derivation is never independent).
  for (const m of metas) for (const dep of m.dependsOn) if (parent.has(dep)) union(m.id, dep);

  groupRootCache = new Map(metas.map((m) => [m.id, find(m.id)]));
  return groupRootCache;
}

export function independenceGroupOf(systemId: string): string {
  return groupRoots().get(systemId) ?? systemId;
}

/** Collapse a cluster into a ranked Convergence with full attribution. */
export function weighCluster(cluster: Cluster): Convergence {
  const groupMax = new Map<string, number>();
  const contributors: Attribution[] = [];

  for (const { primitive, confidence } of cluster.contributors) {
    const group = independenceGroupOf(primitive.source);
    const contribution = primitive.weight * confidence;
    if (contribution > (groupMax.get(group) ?? -1)) groupMax.set(group, contribution);
    contributors.push({
      systemId: primitive.source,
      factorKey: primitive.native.factorKey,
      raw: primitive.native.raw,
    });
  }

  const weight = [...groupMax.values()].reduce((s, w) => s + w, 0);
  return {
    axis: cluster.axis,
    value: cluster.value,
    independentGroups: groupMax.size,
    weight: Math.round(weight * 1000) / 1000,
    contributors,
  };
}
