/**
 * Explicit, reviewable cross-system equivalence edges (spec §6).
 *
 * Clustering expands a candidate cluster across these edges, carrying `confidence`
 * into the weight. ABSENCE of an edge means "these are not the same thing" — that
 * silence is a deliberate design decision (e.g. Chinese wood/metal have no
 * Western-4 equivalent and are intentionally absent).
 */
import type { OntologyAxis } from "../core/contracts";

export interface Crosswalk {
  axis: OntologyAxis;
  from: string;
  to: string;
  confidence: number; // 0..1
}

export const CROSSWALKS: Crosswalk[] = [
  // Element family overlaps where defensible.
  { axis: "element", from: "chinese:water", to: "western:water", confidence: 0.7 },
  { axis: "element", from: "chinese:fire", to: "western:fire", confidence: 0.6 },
  { axis: "element", from: "chinese:earth", to: "western:earth", confidence: 0.6 },
  // chinese:wood and chinese:metal have NO western-4 equivalent — intentionally absent.
];

/** Undirected confidence between two values on an axis (1 if identical, 0 if none). */
export function crosswalkConfidence(axis: OntologyAxis, a: string, b: string): number {
  if (a === b) return 1;
  for (const edge of CROSSWALKS) {
    if (edge.axis !== axis) continue;
    if ((edge.from === a && edge.to === b) || (edge.from === b && edge.to === a)) {
      return edge.confidence;
    }
  }
  return 0;
}
