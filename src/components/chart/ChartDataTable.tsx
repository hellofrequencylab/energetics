"use client";

import type { ComputedSystem, Convergence, Synthesis, Tension } from "@/lib/synthesis/types";
import { shortName } from "@/lib/system-labels";

interface ChartDataTableProps {
  synthesis: Synthesis;
  computations: ComputedSystem[];
  onSelectConvergence: (index: number) => void;
  onSelectTension: (index: number) => void;
}

/**
 * Turn a namespaced ontology value into something a person can read. Strips a
 * leading "family:" style namespace and title-cases the remaining words so
 * "element:fire" reads as "Fire" and "water_bearer" reads as "Water Bearer".
 */
function humanizeValue(value: string): string {
  const withoutNamespace = value.includes(":") ? value.slice(value.indexOf(":") + 1) : value;
  return withoutNamespace
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * The short, friendly label for a contributing system. Looks up the system's
 * display name from the computations so a new system still gets a sensible
 * first-word fallback.
 */
function systemLabel(systemId: string, displayNameById: Map<string, string>): string {
  const displayName = displayNameById.get(systemId) ?? systemId;
  return shortName(systemId, displayName);
}

/** The unique contributing systems for a convergence, in first-seen order. */
function foundBy(convergence: Convergence, displayNameById: Map<string, string>): string[] {
  const seen = new Set<string>();
  const labels: string[] = [];
  for (const contributor of convergence.contributors) {
    if (seen.has(contributor.systemId)) continue;
    seen.add(contributor.systemId);
    labels.push(systemLabel(contributor.systemId, displayNameById));
  }
  return labels;
}

export function ChartDataTable(props: ChartDataTableProps) {
  const { synthesis, computations, onSelectConvergence, onSelectTension } = props;

  const displayNameById = new Map<string, string>(
    computations.map((computation) => [computation.meta.id, computation.meta.displayName]),
  );

  // Keep each convergence paired with its original index so the click handlers
  // point at the right entry in synthesis.convergences after sorting.
  const rankedConvergences = synthesis.convergences
    .map((convergence, index) => ({ convergence, index }))
    .sort((a, b) => b.convergence.independentGroups - a.convergence.independentGroups);

  return (
    <div className="flex flex-col gap-8 text-foreground">
      <section>
        <table className="w-full border-collapse text-left text-sm">
          <caption className="mb-2 text-left text-base font-semibold text-foreground">
            Themes
          </caption>
          <thead>
            <tr className="border-b border-border">
              <th scope="col" className="px-3 py-2 font-medium text-muted">
                Theme
              </th>
              <th scope="col" className="px-3 py-2 font-medium text-muted">
                Axis
              </th>
              <th scope="col" className="px-3 py-2 font-medium text-muted">
                Independent sources
              </th>
              <th scope="col" className="px-3 py-2 font-medium text-muted">
                Found by
              </th>
            </tr>
          </thead>
          <tbody>
            {rankedConvergences.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-4 text-muted">
                  No themes yet.
                </td>
              </tr>
            ) : (
              rankedConvergences.map(({ convergence, index }) => {
                const contributors = foundBy(convergence, displayNameById);
                return (
                  <tr key={index} className="border-b border-border hover:bg-surface">
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => onSelectConvergence(index)}
                        className="rounded text-left font-medium text-accent underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      >
                        {humanizeValue(convergence.value)}
                      </button>
                    </td>
                    <td className="px-3 py-2 text-foreground">{humanizeValue(convergence.axis)}</td>
                    <td className="px-3 py-2 text-foreground">{convergence.independentGroups}</td>
                    <td className="px-3 py-2 text-muted">
                      {contributors.length > 0 ? contributors.join(", ") : "No systems"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </section>

      <section>
        <table className="w-full border-collapse text-left text-sm">
          <caption className="mb-2 text-left text-base font-semibold text-foreground">
            Tensions
          </caption>
          <thead>
            <tr className="border-b border-border">
              <th scope="col" className="px-3 py-2 font-medium text-muted">
                Pole A
              </th>
              <th scope="col" className="px-3 py-2 font-medium text-muted">
                Pole B
              </th>
              <th scope="col" className="px-3 py-2 font-medium text-muted">
                Axis
              </th>
            </tr>
          </thead>
          <tbody>
            {synthesis.tensions.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-3 py-4 text-muted">
                  No tensions yet.
                </td>
              </tr>
            ) : (
              synthesis.tensions.map((tension: Tension, index) => {
                const poleA = tension.sides[0]?.value ?? tension.poles[0];
                const poleB = tension.sides[1]?.value ?? tension.poles[1];
                return (
                  <tr key={index} className="border-b border-border hover:bg-surface">
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => onSelectTension(index)}
                        className="rounded text-left font-medium text-accent underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      >
                        {humanizeValue(poleA)}
                      </button>
                    </td>
                    <td className="px-3 py-2 text-foreground">{humanizeValue(poleB)}</td>
                    <td className="px-3 py-2 text-foreground">{humanizeValue(tension.axis)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
