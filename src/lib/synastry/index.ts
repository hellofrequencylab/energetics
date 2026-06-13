/**
 * Synastry — "connections with others": compare two people's charts. Two lenses,
 * both consistent with the platform's principles:
 *
 *  1. Cross-chart aspects — geometric ties between A's planets and B's planets
 *     (the classic synastry grid), from the shared Western placements.
 *  2. Shared emphases & complementary tensions — computed on the ONTOLOGY: where
 *     both people's charts independently converge on the same axis/value (shared
 *     ground), and where one carries a pole and the other its declared opposite
 *     (complementary tension). Deterministic; no blended "compatibility number".
 */
import type { NativeResult, OntologyAxis } from "@/lib/core/contracts";
import { OPPOSITIONS } from "@/lib/ontology/oppositions";
import { angularSeparation } from "@/lib/core/zodiac";
import { synthesize } from "@/lib/synthesis";
import type { ComputedSystem } from "@/lib/synthesis/types";

export interface CrossAspect {
  a: string; // A's body
  b: string; // B's body
  aspect: string;
  orb: number;
}

export interface SharedEmphasis {
  axis: OntologyAxis;
  value: string;
  aGroups: number;
  bGroups: number;
}

export interface ComplementaryTension {
  axis: OntologyAxis;
  aValue: string;
  bValue: string;
}

export interface SynastryResult {
  crossAspects: CrossAspect[];
  sharedEmphases: SharedEmphasis[];
  complementaryTensions: ComplementaryTension[];
}

const ASPECTS = [
  { type: "conjunction", angle: 0, orb: 5 },
  { type: "opposition", angle: 180, orb: 5 },
  { type: "trine", angle: 120, orb: 4 },
  { type: "square", angle: 90, orb: 4 },
  { type: "sextile", angle: 60, orb: 3 },
];

const BODY_KEYS = [
  "sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn",
  "uranus", "neptune", "pluto", "northNode", "chiron", "ascendant", "midheaven",
];
const LABEL: Record<string, string> = {
  sun: "Sun", moon: "Moon", mercury: "Mercury", venus: "Venus", mars: "Mars",
  jupiter: "Jupiter", saturn: "Saturn", uranus: "Uranus", neptune: "Neptune",
  pluto: "Pluto", northNode: "North Node", chiron: "Chiron", ascendant: "Asc", midheaven: "MC",
};

function longitudes(western?: NativeResult): { id: string; lon: number }[] {
  if (!western) return [];
  const out: { id: string; lon: number }[] = [];
  for (const key of BODY_KEYS) {
    const f = western.factors[key];
    if (!f) continue;
    const v = f.value as { signIndex: number; degree: number };
    if (typeof v?.signIndex !== "number") continue;
    out.push({ id: LABEL[key], lon: v.signIndex * 30 + v.degree });
  }
  return out;
}

function crossChartAspects(westA?: NativeResult, westB?: NativeResult): CrossAspect[] {
  const A = longitudes(westA);
  const B = longitudes(westB);
  const hits: CrossAspect[] = [];
  for (const a of A) {
    for (const b of B) {
      const sep = angularSeparation(a.lon, b.lon);
      const lum = ["Sun", "Moon"].includes(a.id) || ["Sun", "Moon"].includes(b.id) ? 1 : 0;
      let best: { type: string; orb: number } | null = null;
      for (const def of ASPECTS) {
        const orb = Math.abs(sep - def.angle);
        if (orb <= def.orb + lum && (!best || orb < best.orb)) best = { type: def.type, orb };
      }
      if (best) hits.push({ a: a.id, b: b.id, aspect: best.type, orb: Number(best.orb.toFixed(2)) });
    }
  }
  return hits.sort((x, y) => x.orb - y.orb).slice(0, 15);
}

export function computeSynastry(a: ComputedSystem[], b: ComputedSystem[]): SynastryResult {
  const synA = synthesize("a", a);
  const synB = synthesize("b", b);

  // Shared emphases: axis/value where both charts independently converge.
  const bByKey = new Map(synB.convergences.map((c) => [`${c.axis}::${c.value}`, c]));
  const sharedEmphases: SharedEmphasis[] = [];
  for (const ca of synA.convergences) {
    const cb = bByKey.get(`${ca.axis}::${ca.value}`);
    if (cb) {
      sharedEmphases.push({ axis: ca.axis, value: ca.value, aGroups: ca.independentGroups, bGroups: cb.independentGroups });
    }
  }
  sharedEmphases.sort((x, y) => y.aGroups + y.bGroups - (x.aGroups + x.bGroups));

  // Complementary tensions: declared oppositions split across the two people.
  const aVals = new Set(synA.convergences.map((c) => `${c.axis}::${c.value}`));
  const bVals = new Set(synB.convergences.map((c) => `${c.axis}::${c.value}`));
  const complementaryTensions: ComplementaryTension[] = [];
  for (const o of OPPOSITIONS) {
    const [p1, p2] = o.poles;
    if (aVals.has(`${o.axis}::${p1}`) && bVals.has(`${o.axis}::${p2}`)) {
      complementaryTensions.push({ axis: o.axis, aValue: p1, bValue: p2 });
    } else if (aVals.has(`${o.axis}::${p2}`) && bVals.has(`${o.axis}::${p1}`)) {
      complementaryTensions.push({ axis: o.axis, aValue: p2, bValue: p1 });
    }
  }

  const westA = a.find((c) => c.meta.id === "western-tropical")?.native;
  const westB = b.find((c) => c.meta.id === "western-tropical")?.native;

  return {
    crossAspects: crossChartAspects(westA, westB),
    sharedEmphases: sharedEmphases.slice(0, 12),
    complementaryTensions,
  };
}
