import { OPPOSITIONS } from "@/lib/ontology/oppositions";
import type { Attribution, Cluster, Tension } from "./types";

/**
 * Detect tensions: declared opposition pairs where BOTH poles are supported
 * (spec §7.4). Tension is only computed across declared oppositions — never
 * inferred — and opposing values are surfaced, never averaged away.
 */
export function findTensions(clusters: Cluster[]): Tension[] {
  // Index clusters by axis → representative value.
  const byAxisValue = new Map<string, Cluster>();
  for (const c of clusters) byAxisValue.set(`${c.axis}::${c.value}`, c);

  const attributionsOf = (c: Cluster): Attribution[] =>
    c.contributors.map(({ primitive }) => ({
      systemId: primitive.source,
      factorKey: primitive.native.factorKey,
      raw: primitive.native.raw,
    }));

  const tensions: Tension[] = [];
  for (const opp of OPPOSITIONS) {
    const a = byAxisValue.get(`${opp.axis}::${opp.poles[0]}`);
    const b = byAxisValue.get(`${opp.axis}::${opp.poles[1]}`);
    if (a && b) {
      tensions.push({
        axis: opp.axis,
        poles: opp.poles,
        sides: [
          { value: opp.poles[0], contributors: attributionsOf(a) },
          { value: opp.poles[1], contributors: attributionsOf(b) },
        ],
      });
    }
  }
  return tensions;
}
