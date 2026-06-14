"use client";

import { useMemo, useState } from "react";
import type { ComputedSystem, Synthesis } from "@/lib/synthesis/types";
import { shortName } from "@/lib/system-labels";

/**
 * ArcView: a co-occurrence diagram. Every system sits evenly around a circle.
 * When two systems both contribute to the same theme, an arc curves between them
 * through the middle; the more themes they share, the thicker and brighter the
 * arc. Hover or select an arc to light it and fade the rest; selecting it opens
 * the strongest theme those two systems share.
 */

const VW = 480;
const VH = 480;
const C = { x: 240, y: 240 };
const R = 178;
const GOLD = "#d4b072";
const INK = "#0e0b12";
const MAX_W = 7; // arc stroke cap, keeps the busiest pairs legible

interface Node {
  id: string;
  short: string;
  x: number;
  y: number;
  right: boolean;
}

interface Pair {
  key: string;
  ai: number;
  bi: number;
  /** convergence indices (into synthesis.convergences) both systems contribute to. */
  convs: { index: number; groups: number }[];
  /** index of the strongest shared convergence. */
  bestIndex: number;
  shared: number;
}

const pairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);

export function ArcView({
  synthesis,
  computations,
  onSelectConvergence,
}: {
  synthesis: Synthesis;
  computations: ComputedSystem[];
  onSelectConvergence: (index: number) => void;
  onSelectTension: (index: number) => void;
}) {
  const [active, setActive] = useState<string | null>(null);

  const nodes: Node[] = useMemo(() => {
    const n = Math.max(computations.length, 1);
    return computations.map((c, i) => {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      const x = C.x + Math.cos(a) * R;
      return {
        id: c.meta.id,
        short: shortName(c.meta.id, c.meta.displayName),
        x,
        y: C.y + Math.sin(a) * R,
        right: x >= C.x,
      };
    });
  }, [computations]);

  const indexOf = useMemo(() => new Map(nodes.map((s, i) => [s.id, i])), [nodes]);

  // Build the pair list: for each convergence, connect every pair of distinct
  // contributing systems, accumulating the themes they share.
  const pairs: Pair[] = useMemo(() => {
    const map = new Map<string, Pair>();
    synthesis.convergences.forEach((cv, index) => {
      const ids = [...new Set(cv.contributors.map((a) => a.systemId))].filter((id) =>
        indexOf.has(id),
      );
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          const key = pairKey(ids[i], ids[j]);
          const existing = map.get(key);
          const entry = { index, groups: cv.independentGroups };
          if (existing) {
            existing.convs.push(entry);
          } else {
            map.set(key, {
              key,
              ai: indexOf.get(ids[i])!,
              bi: indexOf.get(ids[j])!,
              convs: [entry],
              bestIndex: index,
              shared: 0,
            });
          }
        }
      }
    });
    const out = [...map.values()];
    for (const p of out) {
      p.shared = p.convs.length;
      p.bestIndex = p.convs.reduce((best, c) => (c.groups > best.groups ? c : best), p.convs[0])
        .index;
    }
    // Draw busiest pairs last so they sit on top.
    return out.sort((a, b) => a.shared - b.shared);
  }, [synthesis.convergences, indexOf]);

  const maxShared = useMemo(() => pairs.reduce((m, p) => Math.max(m, p.shared), 0) || 1, [pairs]);

  const activate = (fn: () => void) => (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fn();
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <header className="mb-3">
        <h3 className="font-display text-lg font-semibold text-foreground">How systems agree</h3>
        <p className="mt-0.5 text-sm text-muted">
          Each arc links two systems that found the same theme. Thicker arcs share more. Select an
          arc to open the strongest theme they share.
        </p>
      </header>

      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        className="w-full select-none"
        role="img"
        aria-label="System co-occurrence: arcs link systems that agree on the same themes"
      >
        <circle cx={C.x} cy={C.y} r={R} fill="none" stroke="#4a4358" strokeOpacity={0.25} />

        {/* arcs */}
        {pairs.map((p) => {
          const a = nodes[p.ai];
          const b = nodes[p.bi];
          // Quadratic Bezier control point pulled toward the center so arcs bow
          // inward; closer pairs bow more so they stay distinct from the ring.
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2;
          const cx = C.x + (mx - C.x) * 0.25;
          const cy = C.y + (my - C.y) * 0.25;
          const t = p.shared / maxShared;
          const width = 1 + t * (MAX_W - 1);
          const isActive = active === p.key;
          const faded = active !== null && !isActive;
          const sel = () => onSelectConvergence(p.bestIndex);
          return (
            <path
              key={p.key}
              d={`M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`}
              fill="none"
              stroke={GOLD}
              strokeLinecap="round"
              strokeWidth={isActive ? width + 1.5 : width}
              strokeOpacity={isActive ? 0.95 : faded ? 0.06 : 0.18 + t * 0.4}
              role="button"
              tabIndex={0}
              aria-label={`${a.short} and ${b.short} share ${p.shared} theme${p.shared === 1 ? "" : "s"}. Open the strongest.`}
              className="cursor-pointer focus:outline-none"
              onPointerEnter={() => setActive(p.key)}
              onPointerLeave={() => setActive((cur) => (cur === p.key ? null : cur))}
              onFocus={() => setActive(p.key)}
              onBlur={() => setActive((cur) => (cur === p.key ? null : cur))}
              onClick={sel}
              onKeyDown={activate(sel)}
            />
          );
        })}

        {/* system dots and labels */}
        {nodes.map((s) => {
          const dim = active !== null && !activePairTouches(pairs, active, s, nodes);
          return (
            <g key={s.id} style={{ opacity: dim ? 0.4 : 1 }}>
              <circle cx={s.x} cy={s.y} r={7} fill={GOLD} fillOpacity={0.9} stroke={INK} strokeWidth={1.5} />
              <text
                x={s.x + (s.right ? 12 : -12)}
                y={s.y + 4}
                textAnchor={s.right ? "start" : "end"}
                fontSize={12}
                fill="#cfc9d6"
                style={{ paintOrder: "stroke", stroke: INK, strokeWidth: 3 }}
              >
                {s.short}
              </text>
            </g>
          );
        })}
      </svg>

      <p className="mt-3 text-center text-xs text-muted">
        Each dot is a system. Thicker arcs mean the two agree on more themes. Hover or select an arc
        to focus it.
      </p>

      {pairs.length === 0 && (
        <p className="mt-2 rounded-lg border border-border bg-background/40 px-3 py-4 text-center text-sm text-muted">
          No two systems share a theme yet. Add a birth time or place to find more overlap.
        </p>
      )}
    </section>
  );
}

/** True if the active arc connects to this node (so it stays bright). */
function activePairTouches(
  pairs: Pair[],
  active: string | null,
  node: Node,
  nodes: Node[],
): boolean {
  if (active === null) return false;
  const p = pairs.find((x) => x.key === active);
  if (!p) return false;
  return nodes[p.ai].id === node.id || nodes[p.bi].id === node.id;
}
