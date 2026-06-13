import type { Convergence } from "./types";

/**
 * Rank convergences (spec §7.5): primary key = count of independent groups in
 * agreement (breadth of independent sources matters more than a fabricated
 * decimal); secondary = damped weight.
 */
export function rankConvergences(convergences: Convergence[]): Convergence[] {
  return [...convergences].sort(
    (a, b) => b.independentGroups - a.independentGroups || b.weight - a.weight,
  );
}
