"use client";

import { useMemo } from "react";
import type { ComputedSystem, Synthesis } from "@/lib/synthesis/types";

/**
 * StrengthsBar: a ranked list of the themes your chart agrees on most, read as
 * "your strengths". Each row is a horizontal bar sized by how many independent
 * source groups land on it, so the longer bars are the steadier reads. A compact
 * tensions list sits below for the places two poles pull at once. Rows and
 * tensions are real buttons that open the matching detail in the parent view.
 */

const GOLD = "#d4b072";
const VIOLET = "#8b7dff";

/** Strip a "family:" namespace and title-case the bare term for display. */
function humanize(value: string): string {
  const bare = value.includes(":") ? value.split(":")[1] : value;
  return bare
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const sourceLabel = (n: number): string => `${n} source${n === 1 ? "" : "s"}`;

export function StrengthsBar({
  synthesis,
  onSelectConvergence,
  onSelectTension,
}: {
  synthesis: Synthesis;
  computations: ComputedSystem[];
  onSelectConvergence: (index: number) => void;
  onSelectTension: (index: number) => void;
}) {
  // Keep each convergence's original index so selection points at the real item,
  // then sort the view by independent-source-group count, strongest first.
  const ranked = useMemo(
    () =>
      synthesis.convergences
        .map((cv, index) => ({ cv, index }))
        .sort((a, b) => b.cv.independentGroups - a.cv.independentGroups),
    [synthesis.convergences],
  );

  const maxGroups = useMemo(
    () => ranked.reduce((m, r) => Math.max(m, r.cv.independentGroups), 0) || 1,
    [ranked],
  );

  return (
    <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <header className="mb-4">
        <h3 className="font-display text-lg font-semibold text-foreground">Your strengths</h3>
        <p className="mt-0.5 text-sm text-muted">
          Themes ranked by how many independent sources land on them. Longer bars are the steadier
          reads. Select one to see who found it.
        </p>
      </header>

      {ranked.length === 0 ? (
        <p className="rounded-lg border border-border bg-background/40 px-3 py-6 text-center text-sm text-muted">
          No shared strengths yet. Add a birth time or place to give the systems more to agree on.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {ranked.map(({ cv, index }) => {
            const pct = Math.max(6, Math.round((cv.independentGroups / maxGroups) * 100));
            const label = humanize(cv.value);
            return (
              <li key={`${cv.axis}::${cv.value}::${index}`}>
                <button
                  type="button"
                  onClick={() => onSelectConvergence(index)}
                  aria-label={`${label}, ${sourceLabel(cv.independentGroups)}. Open details.`}
                  className="group flex w-full items-center gap-3 rounded-lg border border-transparent px-2 py-1.5 text-left transition hover:border-border hover:bg-background/40 focus:outline-none focus-visible:border-accent/60"
                >
                  <span className="w-28 shrink-0 truncate text-sm font-medium text-foreground sm:w-36">
                    {label}
                  </span>
                  <span className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-background/60">
                    <span
                      className="absolute inset-y-0 left-0 rounded-full transition-[width]"
                      style={{ width: `${pct}%`, background: GOLD }}
                    />
                  </span>
                  <span className="w-16 shrink-0 text-right text-xs text-muted sm:w-20">
                    {sourceLabel(cv.independentGroups)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-5 border-t border-border pt-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-accent-2">Tensions</h4>
        {synthesis.tensions.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            No held tensions found. Nothing in your chart pulls hard in two directions at once.
          </p>
        ) : (
          <ul className="mt-2 flex flex-col gap-1.5">
            {synthesis.tensions.map((t, index) => {
              const a = humanize(t.sides[0]?.value ?? t.poles[0]);
              const b = humanize(t.sides[1]?.value ?? t.poles[1]);
              return (
                <li key={`${t.axis}::${index}`}>
                  <button
                    type="button"
                    onClick={() => onSelectTension(index)}
                    aria-label={`Tension: ${a} versus ${b}. Open details.`}
                    className="flex w-full items-center gap-2 rounded-lg border border-transparent px-2 py-1.5 text-left text-sm transition hover:border-border hover:bg-background/40 focus:outline-none focus-visible:border-accent-2/60"
                  >
                    <span
                      aria-hidden="true"
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: VIOLET }}
                    />
                    <span className="text-foreground">{a}</span>
                    <span className="text-accent-2">vs</span>
                    <span className="text-foreground">{b}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
