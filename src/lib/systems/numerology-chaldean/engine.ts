import type { BirthEvent } from "@/lib/core/birth-event";
import type { NativeResult, SystemEngine, SystemMeta } from "@/lib/core/contracts";

export const meta: SystemMeta = {
  id: "numerology-chaldean",
  displayName: "Numerology (Chaldean)",
  lineage: "traditional",
  requires: { time: false, place: false },
  derivedFrom: "name",
  dependsOn: [],
  corpusVersion: "1",
};

/**
 * Chaldean letter values (1–8; 9 is never assigned — considered sacred). This is
 * the platform's only `name`-derived system, so it forms its own independence
 * group: when it agrees with an ephemeris and a date system, that's the strong
 * three-source convergence the synthesis is built to surface.
 */
const CHALDEAN: Record<string, number> = {
  A: 1, I: 1, J: 1, Q: 1, Y: 1,
  B: 2, K: 2, R: 2,
  C: 3, G: 3, L: 3, S: 3,
  D: 4, M: 4, T: 4,
  E: 5, H: 5, N: 5, X: 5,
  U: 6, V: 6, W: 6,
  O: 7, Z: 7,
  F: 8, P: 8,
};

/** Reduce to a single digit 1–9 (Chaldean uses no master numbers). */
function reduce(n: number): number {
  let v = n;
  while (v > 9) v = String(v).split("").reduce((s, d) => s + Number(d), 0);
  return v;
}

export const engine: SystemEngine = {
  meta,
  compute(birth: BirthEvent): NativeResult {
    const name = birth.name?.trim();
    if (!name) return { systemId: meta.id, factors: {} }; // needs a name

    const total = name
      .toUpperCase()
      .split("")
      .reduce((sum, ch) => sum + (CHALDEAN[ch] ?? 0), 0);
    if (total === 0) return { systemId: meta.id, factors: {} };

    const nameNumber = reduce(total);
    return {
      systemId: meta.id,
      factors: {
        "name-number": {
          key: "name-number",
          label: "Name Number",
          value: nameNumber,
          display: `${nameNumber} (compound ${total})`,
        },
        compound: { key: "compound", label: "Compound", value: total, display: String(total) },
      },
    };
  },
};
