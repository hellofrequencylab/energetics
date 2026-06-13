import type { OntologyAxis, Primitive } from "@/lib/core/contracts";
import { crosswalkConfidence } from "@/lib/ontology/crosswalks";
import type { Cluster } from "./types";

/**
 * Group primitives by (axis, value), then expand each cluster across crosswalk
 * edges into equivalence sets — carrying the edge confidence into each merged
 * contributor (spec §7.2). Absence of a crosswalk edge keeps values separate.
 */
export function cluster(primitives: Primitive[]): Cluster[] {
  const byAxis = new Map<OntologyAxis, Primitive[]>();
  for (const p of primitives) {
    const list = byAxis.get(p.axis) ?? [];
    list.push(p);
    byAxis.set(p.axis, list);
  }

  const clusters: Cluster[] = [];
  for (const [axis, prims] of byAxis) {
    const values = [...new Set(prims.map((p) => p.value))];

    // Union-find over the distinct values, joining any pair with a crosswalk edge.
    const parent = new Map<string, string>(values.map((v) => [v, v]));
    const find = (v: string): string => {
      let r = v;
      while (parent.get(r) !== r) r = parent.get(r)!;
      return r;
    };
    const union = (a: string, b: string) => parent.set(find(a), find(b));
    for (let i = 0; i < values.length; i++) {
      for (let j = i + 1; j < values.length; j++) {
        if (crosswalkConfidence(axis, values[i], values[j]) > 0) union(values[i], values[j]);
      }
    }

    // Bucket primitives by component root.
    const components = new Map<string, Primitive[]>();
    for (const p of prims) {
      const root = find(p.value);
      const list = components.get(root) ?? [];
      list.push(p);
      components.set(root, list);
    }

    for (const comp of components.values()) {
      // Representative value = the one with the greatest total native weight.
      const weightByValue = new Map<string, number>();
      for (const p of comp) weightByValue.set(p.value, (weightByValue.get(p.value) ?? 0) + p.weight);
      const representative = [...weightByValue.entries()].sort((a, b) => b[1] - a[1])[0][0];

      clusters.push({
        axis,
        value: representative,
        values: [...new Set(comp.map((p) => p.value))],
        contributors: comp.map((p) => ({
          primitive: p,
          confidence: crosswalkConfidence(axis, p.value, representative),
        })),
      });
    }
  }

  return clusters;
}
