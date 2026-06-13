/**
 * Declared opposing pairs per axis (spec §6). Tension is computed ONLY across
 * these declared oppositions — never inferred. Opposing values are surfaced,
 * never averaged away.
 */
import type { OntologyAxis } from "../core/contracts";

export interface Opposition {
  axis: OntologyAxis;
  poles: [string, string];
}

export const OPPOSITIONS: Opposition[] = [
  // Polarity is the cleanest cross-system opposition.
  { axis: "polarity", poles: ["active", "receptive"] },
  // Western elemental oppositions.
  { axis: "element", poles: ["western:fire", "western:water"] },
  { axis: "element", poles: ["western:air", "western:earth"] },
  // A few declared thematic oppositions.
  { axis: "theme", poles: ["structure", "play"] },
  { axis: "theme", poles: ["discipline", "exploration"] },
];

/** The opposite of `value` on `axis`, if one is declared. */
export function oppositeOf(axis: OntologyAxis, value: string): string | null {
  for (const o of OPPOSITIONS) {
    if (o.axis !== axis) continue;
    if (o.poles[0] === value) return o.poles[1];
    if (o.poles[1] === value) return o.poles[0];
  }
  return null;
}
