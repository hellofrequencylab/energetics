"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ComputedSystem, Convergence, Synthesis, Tension } from "@/lib/synthesis/types";
import { shortName } from "@/lib/system-labels";
import { energyCheatSheet } from "@/lib/cheatsheet";
import { convergenceMeaning } from "@/lib/convergence-meaning";
import { downloadSvgAsPng } from "@/lib/svg-export";
import { StrengthsBar } from "./chart/StrengthsBar";
import { ArcView } from "./chart/ArcView";
import { ChartDataTable } from "./chart/ChartDataTable";

/**
 * The Convergence Explorer: the flagship, interactive visual of the reading.
 *
 * It is a small dashboard. Switch views (map, ranked bars, arcs, table), choose a
 * lens (everything, your strengths, your tensions), filter by what each system
 * reads from, and drag the map's theme points (the layout is remembered per
 * chart). Hover a point for a tooltip; click a point in any view to open the
 * Quick info panel, which explains the strength and the growth edge, and can write
 * a deeper reading on demand. Empowerment-framed, themeable, keyboard accessible.
 */

const VW = 640;
const VH = 640;
const C = { x: 320, y: 320 };
const R_SYS = 250;

const GROUP_COLOR: Record<string, string> = { ephemeris: "#6aa0cf", date: "#d4b072", name: "#8b7dff" };
const GROUP_LABEL: Record<string, string> = { ephemeris: "the sky", date: "the calendar", name: "your name" };
const GROUP_SHORT: Record<string, string> = { ephemeris: "Sky", date: "Calendar", name: "Name" };
const GOLD = "#d4b072";
const VIOLET = "#8b7dff";
const SELF = "#f3d9a8";
const THREAD = "#4a4358";
const INK = "#0e0b12";

function humanize(value: string): string {
  const bare = value.includes(":") ? value.split(":")[1] : value;
  return bare.charAt(0).toUpperCase() + bare.slice(1);
}

interface SystemNode {
  id: string;
  name: string;
  short: string;
  derivedFrom: string;
  x: number;
  y: number;
}
interface ConvNode {
  cv: Convergence;
  i: number;
  strong: boolean;
  bx: number;
  by: number;
  systemIds: string[];
}
type XY = { x: number; y: number };
type Anchor = { node: ConvNode } | { xy: XY };
interface TensionLink {
  t: Tension;
  i: number;
  a: Anchor;
  b: Anchor;
}
type View = "map" | "bars" | "arc" | "table";
type Lens = "all" | "strengths" | "tensions";
type Selection =
  | { kind: "self" }
  | { kind: "system"; i: number }
  | { kind: "convergence"; i: number }
  | { kind: "tension"; i: number };
type Hover = { label: string; sub: string; x: number; y: number } | null;

export function ConvergenceChart({
  synthesis,
  computations,
  selfName,
}: {
  synthesis: Synthesis;
  computations: ComputedSystem[];
  selfName: string;
}) {
  const [view, setView] = useState<View>("map");
  const [lens, setLens] = useState<Lens>("all");
  const [sel, setSel] = useState<Selection | null>(null);
  const [hover, setHover] = useState<Hover>(null);
  const [drag, setDrag] = useState<Record<number, XY>>({});
  const [dragging, setDragging] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragState = useRef<{ i: number; moved: boolean; sx: number; sy: number } | null>(null);

  // Which source groups are shown (filter). Default: all present.
  const groups = useMemo(() => [...new Set(computations.map((c) => c.meta.derivedFrom))], [computations]);
  const [sources, setSources] = useState<Set<string>>(() => new Set(groups));
  // Reset the source filter when the chart's set of systems changes.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSources(new Set(groups));
  }, [groups]);

  const storageKey = `onesky:layout:${synthesis.birthEventId}`;
  // Load a remembered layout once on mount (after render, to avoid hydration drift).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setDrag(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  const sysNodes: SystemNode[] = useMemo(() => {
    const n = Math.max(computations.length, 1);
    return computations.map((c, i) => {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      return {
        id: c.meta.id,
        name: c.meta.displayName,
        short: shortName(c.meta.id, c.meta.displayName),
        derivedFrom: c.meta.derivedFrom,
        x: C.x + Math.cos(a) * R_SYS,
        y: C.y + Math.sin(a) * R_SYS,
      };
    });
  }, [computations]);
  const posOf = useMemo(() => new Map(sysNodes.map((s) => [s.id, s])), [sysNodes]);
  const groupOf = (id: string) => posOf.get(id)?.derivedFrom ?? "";

  const convNodes: ConvNode[] = useMemo(() => {
    const base = synthesis.convergences
      .map((cv, i) => {
        const pts = [...new Set(cv.contributors.map((a) => a.systemId))]
          .map((id) => posOf.get(id))
          .filter((p): p is SystemNode => !!p);
        if (!pts.length) return null;
        const ax = pts.reduce((s, p) => s + p.x, 0) / pts.length;
        const ay = pts.reduce((s, p) => s + p.y, 0) / pts.length;
        const pull = Math.max(0.34, 0.66 - (cv.independentGroups - 1) * 0.08);
        return {
          cv,
          i,
          strong: cv.independentGroups >= 2,
          bx: C.x + (ax - C.x) * pull,
          by: C.y + (ay - C.y) * pull,
          systemIds: pts.map((p) => p.id),
        };
      })
      .filter((n): n is ConvNode => !!n);
    return spread(base);
  }, [synthesis.convergences, posOf]);

  const nodeByKey = useMemo(() => {
    const m = new Map<string, ConvNode>();
    for (const n of convNodes) m.set(`${n.cv.axis}::${n.cv.value}`, n);
    return m;
  }, [convNodes]);
  const tensionPoleKeys = useMemo(() => {
    const s = new Set<string>();
    for (const t of synthesis.tensions) for (const side of t.sides) s.add(`${t.axis}::${side.value}`);
    return s;
  }, [synthesis.tensions]);

  const convPos = (n: ConvNode): XY => drag[n.i] ?? { x: n.bx, y: n.by };
  const anchorPos = (a: Anchor): XY => ("node" in a ? convPos(a.node) : a.xy);

  const tensionLinks: TensionLink[] = useMemo(() => {
    const centroid = (ids: string[]): XY => {
      const pts = ids.map((id) => posOf.get(id)).filter((p): p is SystemNode => !!p);
      if (!pts.length) return { ...C };
      return {
        x: C.x + (pts.reduce((s, p) => s + p.x, 0) / pts.length - C.x) * 0.5,
        y: C.y + (pts.reduce((s, p) => s + p.y, 0) / pts.length - C.y) * 0.5,
      };
    };
    const anchorFor = (axis: string, side: Tension["sides"][number]): Anchor => {
      const node = nodeByKey.get(`${axis}::${side.value}`);
      if (node) return { node };
      return { xy: centroid([...new Set(side.contributors.map((c) => c.systemId))]) };
    };
    return synthesis.tensions.map((t, i) => ({ t, i, a: anchorFor(t.axis, t.sides[0]), b: anchorFor(t.axis, t.sides[1]) }));
  }, [synthesis.tensions, nodeByKey, posOf]);

  const showTensions = lens !== "strengths";

  // --- filters / lens dimming ---------------------------------------------
  const systemShown = (id: string) => sources.has(groupOf(id));
  const themeShown = (n: ConvNode) => n.systemIds.some(systemShown);
  const themeDim = (n: ConvNode) => !themeShown(n) || (lens === "tensions" && !tensionPoleKeys.has(`${n.cv.axis}::${n.cv.value}`));

  // --- drag plumbing -------------------------------------------------------
  function toSvg(e: React.PointerEvent): XY {
    const r = svgRef.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * VW, y: ((e.clientY - r.top) / r.height) * VH };
  }
  function onNodePointerDown(e: React.PointerEvent, n: ConvNode) {
    e.stopPropagation();
    const p = toSvg(e);
    dragState.current = { i: n.i, moved: false, sx: p.x, sy: p.y };
    svgRef.current?.setPointerCapture(e.pointerId);
    setHover(null);
    setDragging(true);
  }
  function onSvgPointerMove(e: React.PointerEvent) {
    const d = dragState.current;
    if (!d) return;
    const p = toSvg(e);
    if (Math.hypot(p.x - d.sx, p.y - d.sy) > 4) d.moved = true;
    setDrag((prev) => ({ ...prev, [d.i]: clampAnnulus(p) }));
  }
  function onSvgPointerUp(e: React.PointerEvent) {
    const d = dragState.current;
    if (!d) return;
    svgRef.current?.releasePointerCapture?.(e.pointerId);
    if (!d.moved) setSel({ kind: "convergence", i: d.i });
    else
      setDrag((cur) => {
        try {
          window.localStorage.setItem(storageKey, JSON.stringify(cur));
        } catch {
          /* ignore */
        }
        return cur;
      });
    dragState.current = null;
    setDragging(false);
  }
  function resetLayout() {
    setDrag({});
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
  }

  const keyActivate = (fn: () => void) => (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fn();
    }
  };
  const litConv = (n: ConvNode) => hover?.label === humanize(n.cv.value) || isSel(sel, "convergence", n.i);

  return (
    <div>
      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-3">
        <Segmented
          label="View"
          value={view}
          onChange={(v) => setView(v as View)}
          options={[
            ["map", "Map"],
            ["bars", "Bars"],
            ["arc", "Arcs"],
            ["table", "Table"],
          ]}
        />
        <Segmented
          label="Lens"
          value={lens}
          onChange={(v) => setLens(v as Lens)}
          options={[
            ["all", "Everything"],
            ["strengths", "Strengths"],
            ["tensions", "Tensions"],
          ]}
        />
        {view === "map" && groups.length > 1 && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs uppercase tracking-wide text-muted">Sources</span>
            {groups.map((g) => {
              const on = sources.has(g);
              return (
                <button
                  key={g}
                  type="button"
                  aria-pressed={on}
                  onClick={() =>
                    setSources((prev) => {
                      const next = new Set(prev);
                      if (next.has(g) && next.size > 1) next.delete(g);
                      else next.add(g);
                      return next;
                    })
                  }
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                    on ? "border-transparent text-ink" : "border-border text-muted"
                  }`}
                  style={on ? { background: GROUP_COLOR[g] ?? "#8a89a0" } : undefined}
                >
                  {GROUP_SHORT[g] ?? g}
                </button>
              );
            })}
          </div>
        )}
        {view === "map" && (
          <div className="ml-auto flex items-center gap-3">
            <button type="button" onClick={resetLayout} className="text-xs text-muted transition hover:text-foreground">
              Reset layout
            </button>
            <button
              type="button"
              onClick={() => svgRef.current && downloadSvgAsPng(svgRef.current, `${selfName || "chart"}-convergence.png`)}
              className="rounded-full border border-border px-2.5 py-1 text-xs text-muted transition hover:text-foreground"
            >
              Save image
            </button>
          </div>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        <div>
          {view === "map" && (
            <>
              <div className="relative">
                <svg
                  ref={svgRef}
                  viewBox={`0 0 ${VW} ${VH}`}
                  className="w-full touch-none select-none"
                  role="img"
                  aria-label="Convergence map: systems, the themes they agree on, and where they pull apart"
                  onPointerMove={onSvgPointerMove}
                  onPointerUp={onSvgPointerUp}
                >
                  <rect x={0} y={0} width={VW} height={VH} fill="transparent" />
                  <circle cx={C.x} cy={C.y} r={R_SYS} fill="none" stroke={THREAD} strokeOpacity={0.3} />
                  <circle cx={C.x} cy={C.y} r={R_SYS * 0.62} fill="none" stroke={THREAD} strokeOpacity={0.16} />

                  {/* threads */}
                  {convNodes.map((n) => {
                    const p = convPos(n);
                    const lit = litConv(n);
                    const dim = themeDim(n);
                    return n.systemIds.map((sid) => {
                      const sp = posOf.get(sid)!;
                      const active = lit || hover?.label === sp.short;
                      const faded = dim || !systemShown(sid);
                      return (
                        <line
                          key={`t${n.i}-${sid}`}
                          x1={p.x}
                          y1={p.y}
                          x2={sp.x}
                          y2={sp.y}
                          stroke={GOLD}
                          strokeWidth={active ? 2.4 : n.strong ? 1.2 : 0.7}
                          strokeOpacity={faded ? 0.07 : active ? 0.9 : n.strong ? 0.4 : 0.2}
                        />
                      );
                    });
                  })}

                  {/* tensions */}
                  {showTensions &&
                    tensionLinks.map((n) => {
                      const a = anchorPos(n.a);
                      const b = anchorPos(n.b);
                      const active = isSel(sel, "tension", n.i) || hover?.label === "Tension";
                      const featured = lens === "tensions";
                      return (
                        <g key={`x${n.i}`}>
                          <line
                            x1={a.x}
                            y1={a.y}
                            x2={b.x}
                            y2={b.y}
                            stroke={VIOLET}
                            strokeWidth={active || featured ? 2.6 : 1.4}
                            strokeOpacity={active ? 0.95 : 0.5}
                            strokeDasharray="5 5"
                          />
                          <g
                            role="button"
                            tabIndex={0}
                            aria-label={`Tension: ${humanize(n.t.sides[0].value)} versus ${humanize(n.t.sides[1].value)}`}
                            className="cursor-pointer focus:outline-none"
                            onClick={() => setSel({ kind: "tension", i: n.i })}
                            onKeyDown={keyActivate(() => setSel({ kind: "tension", i: n.i }))}
                            onPointerEnter={() =>
                              !dragging &&
                              setHover({ label: "Tension", sub: `${humanize(n.t.sides[0].value)} ⟷ ${humanize(n.t.sides[1].value)}`, x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })
                            }
                            onPointerLeave={() => setHover(null)}
                          >
                            <circle cx={(a.x + b.x) / 2} cy={(a.y + b.y) / 2} r={9} fill={VIOLET} fillOpacity={active ? 0.9 : 0.6} />
                            <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 + 4} textAnchor="middle" fontSize={12} fill={INK} fontWeight={700} style={{ pointerEvents: "none" }}>
                              ⟷
                            </text>
                          </g>
                        </g>
                      );
                    })}

                  {/* system dots */}
                  {sysNodes.map((s, i) => {
                    const color = GROUP_COLOR[s.derivedFrom] ?? "#8a89a0";
                    const right = s.x >= C.x;
                    const faded = !systemShown(s.id);
                    return (
                      <g
                        key={s.id}
                        role="button"
                        tabIndex={0}
                        aria-label={`${s.name}, reads from ${GROUP_LABEL[s.derivedFrom] ?? s.derivedFrom}`}
                        className="cursor-pointer focus:outline-none"
                        opacity={faded ? 0.25 : 1}
                        onClick={() => setSel({ kind: "system", i })}
                        onKeyDown={keyActivate(() => setSel({ kind: "system", i }))}
                        onPointerEnter={() => !dragging && setHover({ label: s.short, sub: `reads ${GROUP_LABEL[s.derivedFrom] ?? s.derivedFrom}`, x: s.x, y: s.y })}
                        onPointerLeave={() => setHover(null)}
                      >
                        <circle cx={s.x} cy={s.y} r={isSel(sel, "system", i) ? 11 : 9} fill={color} fillOpacity={0.95} stroke={INK} strokeWidth={1.5} />
                        <text
                          x={s.x + (right ? 14 : -14)}
                          y={s.y + 4}
                          textAnchor={right ? "start" : "end"}
                          fontSize={13}
                          fill="#cfc9d6"
                          style={{ paintOrder: "stroke", stroke: INK, strokeWidth: 3 }}
                        >
                          {s.short}
                        </text>
                      </g>
                    );
                  })}

                  {/* theme dots (draggable) */}
                  {convNodes.map((n) => {
                    const p = convPos(n);
                    const r = n.strong ? 7 + Math.min(n.cv.independentGroups, 4) * 2 : 4.5;
                    const dx = p.x - C.x;
                    const dy = p.y - C.y;
                    const len = Math.hypot(dx, dy) || 1;
                    const lit = litConv(n);
                    const dim = themeDim(n) && !lit;
                    const showLabel = (n.strong || lit) && !dim;
                    return (
                      <g
                        key={`c${n.i}`}
                        role="button"
                        tabIndex={0}
                        aria-label={`${humanize(n.cv.value)}, ${n.cv.independentGroups} source${n.cv.independentGroups === 1 ? "" : "s"}. Drag to move, click for details.`}
                        className="cursor-grab focus:outline-none active:cursor-grabbing"
                        opacity={dim ? 0.18 : 1}
                        onPointerDown={(e) => onNodePointerDown(e, n)}
                        onKeyDown={keyActivate(() => setSel({ kind: "convergence", i: n.i }))}
                        onPointerEnter={() => !dragging && setHover({ label: humanize(n.cv.value), sub: `${n.cv.independentGroups} source${n.cv.independentGroups === 1 ? "" : "s"}`, x: p.x, y: p.y })}
                        onPointerLeave={() => setHover(null)}
                      >
                        <circle cx={p.x} cy={p.y} r={r + (lit ? 7 : 5)} fill={GOLD} fillOpacity={lit ? 0.2 : n.strong ? 0.12 : 0.06} />
                        <circle cx={p.x} cy={p.y} r={r} fill={GOLD} fillOpacity={n.strong ? 0.95 : 0.6} stroke={lit ? "#f3eee7" : "transparent"} strokeWidth={1.5} />
                        {showLabel && (
                          <text
                            x={p.x + (dx / len) * (r + 7)}
                            y={p.y + (dy / len) * (r + 7) + 4}
                            textAnchor={dx >= 0 ? "start" : "end"}
                            fontSize={13}
                            fontWeight={600}
                            fill="#f3eee7"
                            style={{ paintOrder: "stroke", stroke: INK, strokeWidth: 3.5, pointerEvents: "none" }}
                          >
                            {humanize(n.cv.value)}
                          </text>
                        )}
                      </g>
                    );
                  })}

                  {/* self */}
                  <g
                    role="button"
                    tabIndex={0}
                    aria-label={`${selfName}, the center`}
                    className="cursor-pointer focus:outline-none"
                    onClick={() => setSel({ kind: "self" })}
                    onKeyDown={keyActivate(() => setSel({ kind: "self" }))}
                  >
                    <circle cx={C.x} cy={C.y} r={22} fill={SELF} fillOpacity={0.16} />
                    <circle cx={C.x} cy={C.y} r={11} fill={SELF} />
                    <text x={C.x} y={C.y + 38} textAnchor="middle" fontSize={13} fontWeight={600} fill="#f3eee7" style={{ paintOrder: "stroke", stroke: INK, strokeWidth: 3 }}>
                      {selfName}
                    </text>
                  </g>
                </svg>

                {hover && !dragging && (
                  <div
                    className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-border bg-surface/95 px-2.5 py-1.5 text-center text-xs shadow-lg backdrop-blur"
                    style={{ left: `${(hover.x / VW) * 100}%`, top: `${(hover.y / VH) * 100}%`, marginTop: -8 }}
                  >
                    <div className="font-semibold text-foreground">{hover.label}</div>
                    <div className="text-muted">{hover.sub}</div>
                  </div>
                )}
              </div>
              <Legend />
            </>
          )}

          {view === "bars" && (
            <StrengthsBar
              synthesis={synthesis}
              computations={computations}
              onSelectConvergence={(i) => setSel({ kind: "convergence", i })}
              onSelectTension={(i) => setSel({ kind: "tension", i })}
            />
          )}
          {view === "arc" && (
            <ArcView
              synthesis={synthesis}
              computations={computations}
              onSelectConvergence={(i) => setSel({ kind: "convergence", i })}
              onSelectTension={(i) => setSel({ kind: "tension", i })}
            />
          )}
          {view === "table" && (
            <ChartDataTable
              synthesis={synthesis}
              computations={computations}
              onSelectConvergence={(i) => setSel({ kind: "convergence", i })}
              onSelectTension={(i) => setSel({ kind: "tension", i })}
            />
          )}
        </div>

        <QuickInfo
          sel={sel}
          synthesis={synthesis}
          sysNodes={sysNodes}
          convNodes={convNodes}
          tensionLinks={tensionLinks}
          computations={computations}
          selfName={selfName}
          onPick={setSel}
          onClose={() => setSel(null)}
        />
      </div>
    </div>
  );
}

function Segmented({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs uppercase tracking-wide text-muted">{label}</span>
      <div className="inline-flex rounded-full border border-border p-0.5">
        {options.map(([v, l]) => (
          <button
            key={v}
            type="button"
            aria-pressed={value === v}
            onClick={() => onChange(v)}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
              value === v ? "bg-accent text-ink" : "text-muted hover:text-foreground"
            }`}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}

function isSel(sel: Selection | null, kind: Selection["kind"], i?: number): boolean {
  if (!sel || sel.kind !== kind) return false;
  if (kind === "self") return true;
  return (sel as { i: number }).i === i;
}

/** Light force pass so nodes do not overlap and stay inside the ring. */
function spread(nodes: ConvNode[]): ConvNode[] {
  const pos = nodes.map((n) => ({ x: n.bx, y: n.by }));
  const MIN = 42;
  const maxR = R_SYS - 46;
  const minR = 26;
  for (let iter = 0; iter < 120; iter++) {
    for (let i = 0; i < pos.length; i++) {
      for (let j = i + 1; j < pos.length; j++) {
        const dx = pos[j].x - pos[i].x;
        const dy = pos[j].y - pos[i].y;
        const d = Math.hypot(dx, dy) || 0.01;
        if (d < MIN) {
          const push = (MIN - d) / 2;
          const ux = dx / d;
          const uy = dy / d;
          pos[i].x -= ux * push;
          pos[i].y -= uy * push;
          pos[j].x += ux * push;
          pos[j].y += uy * push;
        }
      }
      const dx = pos[i].x - C.x;
      const dy = pos[i].y - C.y;
      const r = Math.hypot(dx, dy) || 0.01;
      if (r > maxR) {
        pos[i].x = C.x + (dx / r) * maxR;
        pos[i].y = C.y + (dy / r) * maxR;
      } else if (r < minR) {
        pos[i].x = C.x + (dx / r) * minR;
        pos[i].y = C.y + (dy / r) * minR;
      }
    }
  }
  return nodes.map((n, k) => ({ ...n, bx: pos[k].x, by: pos[k].y }));
}

function clampAnnulus(p: XY): XY {
  const dx = p.x - C.x;
  const dy = p.y - C.y;
  const r = Math.hypot(dx, dy) || 0.01;
  const maxR = R_SYS - 14;
  if (r > maxR) return { x: C.x + (dx / r) * maxR, y: C.y + (dy / r) * maxR };
  return p;
}

function Legend() {
  const item = (color: string, label: string) => (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
  return (
    <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-xs text-muted">
      {item(GOLD, "Strength (bigger = more agreement)")}
      {item(VIOLET, "Tension")}
      {item("#6aa0cf", "Sky")}
      {item("#d4b072", "Calendar")}
      {item("#8b7dff", "Name")}
      <span className="text-muted/70">Drag a theme to move it.</span>
    </div>
  );
}

function TellMore({ axis, value, systems, selfName }: { axis: string; value: string; systems: string[]; selfName: string }) {
  const [state, setState] = useState<"idle" | "streaming" | "done" | "off">("idle");
  const [text, setText] = useState("");
  async function run() {
    setState("streaming");
    setText("");
    try {
      const res = await fetch("/api/themes/narrate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ axis, value, systems, selfName }),
      });
      if (res.headers.get("x-narrative-available") === "false") {
        setText(await res.text());
        setState("off");
        return;
      }
      if (!res.body) {
        setText(await res.text());
        setState("done");
        return;
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value: v } = await reader.read();
        if (done) break;
        acc += dec.decode(v, { stream: true });
        setText(acc.replace(/\*\*/g, ""));
      }
      setState("done");
    } catch {
      setText("That reading could not be written right now.");
      setState("done");
    }
  }
  if (state === "idle")
    return (
      <button
        onClick={run}
        className="mt-3 rounded-lg border border-accent-2/40 px-3 py-1.5 text-xs font-medium text-accent-2 transition hover:bg-accent-2/10"
      >
        ✦ Tell me more
      </button>
    );
  return (
    <div className="mt-3 space-y-2 text-sm leading-relaxed text-foreground/85">
      {text.split(/\n\n+/).map((p, i) => (
        <p key={i}>{p}</p>
      ))}
      {state === "streaming" && <span className="inline-block h-3.5 w-2 animate-pulse bg-accent-2/70 align-middle" aria-hidden />}
    </div>
  );
}

function QuickInfo({
  sel,
  synthesis,
  sysNodes,
  convNodes,
  tensionLinks,
  computations,
  selfName,
  onPick,
  onClose,
}: {
  sel: Selection | null;
  synthesis: Synthesis;
  sysNodes: SystemNode[];
  convNodes: ConvNode[];
  tensionLinks: TensionLink[];
  computations: ComputedSystem[];
  selfName: string;
  onPick: (s: Selection) => void;
  onClose: () => void;
}) {
  const wrap = "rounded-2xl border border-border bg-surface/40 p-4 sm:p-5 min-h-[320px]";
  const head = (
    <div className="mb-2 flex items-center justify-between gap-2">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-accent">Quick info</h4>
      {sel && (
        <button onClick={onClose} className="text-xs text-muted transition hover:text-foreground" aria-label="Clear selection">
          Clear
        </button>
      )}
    </div>
  );
  const sysName = (id: string) => sysNodes.find((s) => s.id === id)?.short ?? id;

  if (!sel) {
    const strengths = convNodes.filter((n) => n.strong).slice(0, 6);
    return (
      <aside className={wrap}>
        {head}
        <p className="text-sm text-muted">
          This is a map of your strengths and your growth edges. Hover any point for a label, and
          click a theme or tension to read what it means for you, including how it shows up in life.
        </p>
        {strengths.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Your strongest threads</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {strengths.map((n) => (
                <button
                  key={n.i}
                  onClick={() => onPick({ kind: "convergence", i: n.i })}
                  className="rounded-full border border-accent/30 bg-accent/5 px-3 py-1 text-sm transition hover:border-accent/60 hover:bg-accent/10"
                >
                  {humanize(n.cv.value)}
                </button>
              ))}
            </div>
          </div>
        )}
      </aside>
    );
  }

  if (sel.kind === "self") {
    const strong = synthesis.convergences.filter((c) => c.independentGroups >= 2).length;
    return (
      <aside className={wrap}>
        {head}
        <h3 className="font-display text-xl font-semibold">{selfName}</h3>
        <p className="mt-2 text-sm text-foreground/85">
          {synthesis.convergences.length} themes ({strong} cross-confirmed) and {synthesis.tensions.length}{" "}
          tension(s) across {sysNodes.length} systems. Tap a point to explore it.
        </p>
      </aside>
    );
  }

  if (sel.kind === "convergence") {
    const n = convNodes.find((x) => x.i === sel.i);
    if (!n) return <aside className={wrap}>{head}</aside>;
    const meaning = convergenceMeaning(n.cv.axis, n.cv.value);
    return (
      <aside className={wrap}>
        {head}
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display text-xl font-semibold">{humanize(n.cv.value)}</h3>
          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${n.strong ? "bg-accent/20 text-accent" : "border border-border text-muted"}`}>
            {n.cv.independentGroups} source{n.cv.independentGroups === 1 ? "" : "s"}
          </span>
        </div>
        <p className="mt-0.5 text-sm text-muted">{n.cv.axis}{meaning ? ` · ${meaning.essence}` : ""}</p>
        {meaning && (
          <div className="mt-3 space-y-2.5">
            <p className="text-sm leading-relaxed text-foreground/85">{meaning.life}</p>
            <p className="rounded-lg border border-accent/20 bg-accent/5 p-2.5 text-sm leading-relaxed">
              <span className="font-semibold text-accent">Your strength. </span>
              {meaning.strength}
            </p>
            <p className="rounded-lg border border-border p-2.5 text-sm leading-relaxed text-foreground/85">
              <span className="font-semibold text-foreground">Growth edge. </span>
              {meaning.growthEdge}
            </p>
          </div>
        )}
        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted">Found by</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {n.systemIds.map((id) => {
            const idx = sysNodes.findIndex((s) => s.id === id);
            return (
              <button
                key={id}
                onClick={() => onPick({ kind: "system", i: idx })}
                className="rounded-full border border-border px-3 py-1 text-sm transition hover:border-accent/50 hover:text-foreground"
              >
                {sysName(id)}
              </button>
            );
          })}
        </div>
        <TellMore key={`${n.cv.axis}:${n.cv.value}`} axis={n.cv.axis} value={n.cv.value} systems={n.systemIds.map(sysName)} selfName={selfName} />
      </aside>
    );
  }

  if (sel.kind === "tension") {
    const n = tensionLinks.find((x) => x.i === sel.i);
    if (!n) return <aside className={wrap}>{head}</aside>;
    const ma = convergenceMeaning(n.t.axis, n.t.sides[0].value);
    const mb = convergenceMeaning(n.t.axis, n.t.sides[1].value);
    return (
      <aside className={wrap}>
        {head}
        <h3 className="font-display text-xl font-semibold">A held tension</h3>
        <p className="mt-0.5 text-sm text-muted">{n.t.axis}</p>
        <div className="mt-3 flex items-center justify-center gap-3 rounded-lg border border-border bg-background/40 p-3 text-center text-sm">
          <span className="text-foreground">{humanize(n.t.sides[0].value)}</span>
          <span className="text-accent-2">⟷</span>
          <span className="text-foreground">{humanize(n.t.sides[1].value)}</span>
        </div>
        {(ma || mb) && (
          <ul className="mt-3 space-y-2 text-sm">
            {ma && (
              <li>
                <span className="font-medium text-foreground/90">{humanize(n.t.sides[0].value)}</span>
                <span className="text-muted">: {ma.life}</span>
              </li>
            )}
            {mb && (
              <li>
                <span className="font-medium text-foreground/90">{humanize(n.t.sides[1].value)}</span>
                <span className="text-muted">: {mb.life}</span>
              </li>
            )}
          </ul>
        )}
        <p className="mt-3 text-sm text-foreground/85">
          Both poles run strong in you. You hold them at once rather than settling at the midpoint.
          This is not a weakness, it is range, and it is where your timing matters most.
        </p>
      </aside>
    );
  }

  // system (text only, no graphic)
  const s = sysNodes[sel.i];
  const c = computations.find((x) => x.meta.id === s.id);
  const cheats = c ? energyCheatSheet(c).slice(0, 4) : [];
  const inThemes = convNodes.filter((n) => n.systemIds.includes(s.id)).length;
  return (
    <aside className={wrap}>
      {head}
      <h3 className="font-display text-xl font-semibold">{s.name}</h3>
      <p className="mt-0.5 text-sm text-muted">reads {GROUP_LABEL[s.derivedFrom] ?? s.derivedFrom}</p>
      {cheats.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {cheats.map((l, i) => (
            <li key={i} className="text-sm leading-relaxed">
              <span className="font-medium text-foreground/90">{l.term}</span>
              <span className="text-muted">: {l.gist}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs text-muted">Part of {inThemes} theme{inThemes === 1 ? "" : "s"} in this chart.</p>
    </aside>
  );
}
