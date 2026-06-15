import type { Convergence } from "./types";

const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/**
 * Rank convergences (spec §7.5): primary key = count of independent groups in
 * agreement (breadth of independent sources matters more than a fabricated
 * decimal); secondary = damped weight. Axis then value break any remaining tie,
 * so the ranking is a deterministic total order and never depends on input order.
 */
export function rankConvergences(convergences: Convergence[]): Convergence[] {
  return [...convergences].sort(
    (a, b) =>
      b.independentGroups - a.independentGroups ||
      b.weight - a.weight ||
      cmp(a.axis, b.axis) ||
      cmp(a.value, b.value),
  );
}
