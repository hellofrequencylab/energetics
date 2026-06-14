"use client";

import { useMemo, useRef, useState } from "react";
import type { ComputedSystem, Convergence, Synthesis, Tension } from "@/lib/synthesis/types";
import { shortName } from "@/lib/system-labels";
import { energyCheatSheet } from "@/lib/cheatsheet";
import { SystemDiagram } from "./diagrams";

/**
 * The Convergence Chart: the flagship, interactive visual of the reading.
 *
 * Systems sit on the outer ring, colored by their independence group (sky,
 * calendar, name). Each cross-confirmed theme is a node pulled toward the center
 * by how many groups agree, threaded to the systems that found it; a light layout
 * pass spreads them so they are all visible, and you can drag any one to see it
 * better. Hover a point for a tooltip; click it for the Quick info panel on the
 * right. Click a system dot to see that system's chart drawing and stats.
 */

const VW = 640;
const VH = 640;
const C = { x: 320, y: 320 };
const R_SYS = 250;

const GROUP_COLOR: Record<string, string> = {
  ephemeris: "#6aa0cf",
  date: "#d4b072",
  name: "#8b7dff",
};
const GROUP_LABEL: Record<string, string> = {
  ephemeris: "the sky",
  date: "the calendar",
  name: "your name",
};
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
  bx: number;
  by: number;
  systemIds: string[];
}
type XY = { x: number; y: number };
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
  const [sel, setSel] = useState<Selection | null>(null);
  const [hover, setHover] = useState<Hover>(null);
  const [drag, setDrag] = useState<Record<number, XY>>({});
  const [dragging, setDragging] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragState = useRef<{ i: number; moved: boolean; sx: number; sy: number } | null>(null);

  // Systems evenly around the ring (top first).
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

  // Cross-confirmed themes, positioned then spread so they are all visible.
  const convNodes: ConvNode[] = useMemo(() => {
    const base = synthesis.convergences
      .map((cv, i) => {
        if (cv.independentGroups < 2) return null;
        const pts = [...new Set(cv.contributors.map((a) => a.systemId))]
          .map((id) => posOf.get(id))
          .filter((p): p is SystemNode => !!p);
        if (!pts.length) return null;
        const ax = pts.reduce((s, p) => s + p.x, 0) / pts.length;
        const ay = pts.reduce((s, p) => s + p.y, 0) / pts.length;
        const pull = Math.max(0.34, 0.66 - (cv.independentGroups - 2) * 0.1);
        return { cv, i, bx: C.x + (ax - C.x) * pull, by: C.y + (ay - C.y) * pull, systemIds: pts.map((p) => p.id) };
      })
      .filter((n): n is ConvNode => !!n);
    return spread(base);
  }, [synthesis.convergences, posOf]);

  const convPos = (n: ConvNode): XY => drag[n.i] ?? { x: n.bx, y: n.by };

  // Tension poles: centroid of each side's contributing systems.
  const tensions = useMemo(() => {
    const centroid = (ids: string[]): XY | null => {
      const pts = ids.map((id) => posOf.get(id)).filter((p): p is SystemNode => !!p);
      if (!pts.length) return null;
      return {
        x: C.x + (pts.reduce((s, p) => s + p.x, 0) / pts.length - C.x) * 0.55,
        y: C.y + (pts.reduce((s, p) => s + p.y, 0) / pts.length - C.y) * 0.55,
      };
    };
    return synthesis.tensions
      .map((t, i) => {
        const a = centroid([...new Set(t.sides[0].contributors.map((c) => c.systemId))]);
        const b = centroid([...new Set(t.sides[1].contributors.map((c) => c.systemId))]);
        return a && b ? { t, i, a, b } : null;
      })
      .filter((n): n is { t: Tension; i: number; a: XY; b: XY } => !!n);
  }, [synthesis.tensions, posOf]);

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
    dragState.current = null;
    setDragging(false);
  }

  const keyActivate = (fn: () => void) => (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fn();
    }
  };

  const litConv = (n: ConvNode) => hover?.label === humanize(n.cv.value) || isSel(sel, "convergence", n.i);

  return (
    <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
      {/* Chart */}
      <div>
        <div className="relative">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${VW} ${VH}`}
            className="w-full touch-none select-none"
            role="img"
            aria-label="Convergence chart: systems, the themes they agree on, and where they pull apart"
            onPointerMove={onSvgPointerMove}
            onPointerUp={onSvgPointerUp}
          >
            <circle cx={C.x} cy={C.y} r={R_SYS} fill="none" stroke={THREAD} strokeOpacity={0.3} />
            <circle cx={C.x} cy={C.y} r={R_SYS * 0.62} fill="none" stroke={THREAD} strokeOpacity={0.16} />

            {/* threads */}
            {convNodes.map((n) => {
              const p = convPos(n);
              const lit = litConv(n);
              return n.systemIds.map((sid) => {
                const sp = posOf.get(sid)!;
                const active = lit || hover?.label === sp.short || isSel(sel, "system", sysNodes.findIndex((s) => s.id === sid));
                return (
                  <line
                    key={`t${n.i}-${sid}`}
                    x1={p.x}
                    y1={p.y}
                    x2={sp.x}
                    y2={sp.y}
                    stroke={GOLD}
                    strokeWidth={active ? 2.4 : 1.2}
                    strokeOpacity={active ? 0.9 : 0.4}
                  />
                );
              });
            })}

            {/* tensions */}
            {tensions.map((n) => {
              const active = isSel(sel, "tension", n.i);
              return (
                <g key={`x${n.i}`}>
                  <line
                    x1={n.a.x}
                    y1={n.a.y}
                    x2={n.b.x}
                    y2={n.b.y}
                    stroke={VIOLET}
                    strokeWidth={active ? 2.6 : 1.4}
                    strokeOpacity={active ? 0.95 : 0.5}
                    strokeDasharray="5 5"
                  />
                  {[n.a, n.b].map((pt, k) => (
                    <rect
                      key={k}
                      x={pt.x - 5}
                      y={pt.y - 5}
                      width={10}
                      height={10}
                      transform={`rotate(45 ${pt.x} ${pt.y})`}
                      fill={VIOLET}
                      fillOpacity={active ? 1 : 0.85}
                      className="cursor-pointer focus:outline-none"
                      role="button"
                      tabIndex={0}
                      aria-label={`Tension on ${n.t.axis}`}
                      onClick={() => setSel({ kind: "tension", i: n.i })}
                      onKeyDown={keyActivate(() => setSel({ kind: "tension", i: n.i }))}
                      onPointerEnter={() =>
                        setHover({ label: "Tension", sub: `${humanize(n.t.sides[0].value)} ⟷ ${humanize(n.t.sides[1].value)}`, x: (n.a.x + n.b.x) / 2, y: (n.a.y + n.b.y) / 2 })
                      }
                      onPointerLeave={() => setHover(null)}
                    />
                  ))}
                </g>
              );
            })}

            {/* system dots */}
            {sysNodes.map((s, i) => {
              const color = GROUP_COLOR[s.derivedFrom] ?? "#8a89a0";
              const right = s.x >= C.x;
              return (
                <g
                  key={s.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`${s.name}, reads from ${GROUP_LABEL[s.derivedFrom] ?? s.derivedFrom}`}
                  className="cursor-pointer focus:outline-none"
                  onClick={() => setSel({ kind: "system", i })}
                  onKeyDown={keyActivate(() => setSel({ kind: "system", i }))}
                  onPointerEnter={() => setHover({ label: s.short, sub: `reads ${GROUP_LABEL[s.derivedFrom] ?? s.derivedFrom}`, x: s.x, y: s.y })}
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

            {/* convergence dots (draggable) */}
            {convNodes.map((n) => {
              const p = convPos(n);
              const r = 7 + Math.min(n.cv.independentGroups, 4) * 2;
              const dx = p.x - C.x;
              const dy = p.y - C.y;
              const len = Math.hypot(dx, dy) || 1;
              const lx = p.x + (dx / len) * (r + 7);
              const ly = p.y + (dy / len) * (r + 7) + 4;
              const lit = litConv(n);
              return (
                <g
                  key={`c${n.i}`}
                  role="button"
                  tabIndex={0}
                  aria-label={`${humanize(n.cv.value)}, ${n.cv.independentGroups} independent sources. Drag to move, click for details.`}
                  className="cursor-grab focus:outline-none active:cursor-grabbing"
                  onPointerDown={(e) => onNodePointerDown(e, n)}
                  onKeyDown={keyActivate(() => setSel({ kind: "convergence", i: n.i }))}
                  onPointerEnter={() => !dragging && setHover({ label: humanize(n.cv.value), sub: `${n.cv.independentGroups} sources`, x: p.x, y: p.y })}
                  onPointerLeave={() => setHover(null)}
                >
                  <circle cx={p.x} cy={p.y} r={r + (lit ? 7 : 5)} fill={GOLD} fillOpacity={lit ? 0.2 : 0.12} />
                  <circle cx={p.x} cy={p.y} r={r} fill={GOLD} fillOpacity={0.95} stroke={lit ? "#f3eee7" : "transparent"} strokeWidth={1.5} />
                  <text
                    x={lx}
                    y={ly}
                    textAnchor={dx >= 0 ? "start" : "end"}
                    fontSize={13}
                    fontWeight={600}
                    fill="#f3eee7"
                    style={{ paintOrder: "stroke", stroke: INK, strokeWidth: 3.5, pointerEvents: "none" }}
                  >
                    {humanize(n.cv.value)}
                  </text>
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
      </div>

      {/* Quick info */}
      <QuickInfo
        sel={sel}
        synthesis={synthesis}
        sysNodes={sysNodes}
        convNodes={convNodes}
        tensions={tensions}
        computations={computations}
        selfName={selfName}
        onPick={setSel}
        onClose={() => setSel(null)}
      />
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
  const MIN = 58;
  const maxR = R_SYS - 48;
  const minR = 30;
  for (let iter = 0; iter < 90; iter++) {
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
      {item(GOLD, "Cross-confirmed theme")}
      {item(VIOLET, "Tension")}
      <span className="text-muted/70">Systems by source:</span>
      {item("#6aa0cf", "Sky")}
      {item("#d4b072", "Calendar")}
      {item("#8b7dff", "Name")}
      <span className="text-muted/70">Drag a theme to move it.</span>
    </div>
  );
}

function QuickInfo({
  sel,
  synthesis,
  sysNodes,
  convNodes,
  tensions,
  computations,
  selfName,
  onPick,
  onClose,
}: {
  sel: Selection | null;
  synthesis: Synthesis;
  sysNodes: SystemNode[];
  convNodes: ConvNode[];
  tensions: { t: Tension; i: number; a: XY; b: XY }[];
  computations: ComputedSystem[];
  selfName: string;
  onPick: (s: Selection) => void;
  onClose: () => void;
}) {
  const wrap = "rounded-2xl border border-border bg-surface/40 p-4 sm:p-5 min-h-[260px]";
  const heading = (text: string) => (
    <div className="mb-2 flex items-center justify-between gap-2">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-accent">Quick info</h4>
      {sel && (
        <button onClick={onClose} className="text-xs text-muted transition hover:text-foreground" aria-label="Clear selection">
          Clear
        </button>
      )}
      <span className="sr-only">{text}</span>
    </div>
  );

  if (!sel) {
    const top = convNodes.slice(0, 4);
    return (
      <aside className={wrap}>
        {heading("No selection")}
        <p className="text-sm text-muted">
          Hover any point for a quick label. Click a theme, a system, or a tension for details here.
          Drag a theme to move it around.
        </p>
        {top.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Strongest threads</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {top.map((n) => (
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
    return (
      <aside className={wrap}>
        {heading(selfName)}
        <h3 className="font-display text-xl font-semibold">{selfName}</h3>
        <p className="mt-2 text-sm text-foreground/85">
          {synthesis.convergences.filter((c) => c.independentGroups >= 2).length} cross-confirmed
          theme(s) and {synthesis.tensions.length} tension(s) across {sysNodes.length} systems. Tap a
          point to explore it.
        </p>
      </aside>
    );
  }

  if (sel.kind === "convergence") {
    const n = convNodes.find((x) => x.i === sel.i);
    if (!n) return <aside className={wrap}>{heading("")}</aside>;
    return (
      <aside className={wrap}>
        {heading(humanize(n.cv.value))}
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display text-xl font-semibold">{humanize(n.cv.value)}</h3>
          <span className="shrink-0 rounded-full bg-accent/20 px-2.5 py-0.5 text-xs font-semibold text-accent">
            {n.cv.independentGroups} sources
          </span>
        </div>
        <p className="mt-0.5 text-sm text-muted">{n.cv.axis}</p>
        <p className="mt-3 text-sm text-foreground/85">
          {n.cv.independentGroups} independent source group(s) land on this on their own, which makes
          it a reliable read on your energy.
        </p>
        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted">Found by</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {n.systemIds.map((id) => {
            const idx = sysNodes.findIndex((s) => s.id === id);
            return (
              <button
                key={id}
                onClick={() => onPick({ kind: "system", i: idx })}
                className="rounded-full border border-border px-3 py-1 text-sm transition hover:border-accent/50 hover:text-foreground"
              >
                {sysNodes[idx]?.short ?? id}
              </button>
            );
          })}
        </div>
      </aside>
    );
  }

  if (sel.kind === "tension") {
    const n = tensions.find((x) => x.i === sel.i);
    if (!n) return <aside className={wrap}>{heading("")}</aside>;
    return (
      <aside className={wrap}>
        {heading("Tension")}
        <h3 className="font-display text-xl font-semibold">A held tension</h3>
        <p className="mt-0.5 text-sm text-muted">{n.t.axis}</p>
        <div className="mt-3 flex items-center justify-center gap-3 rounded-lg border border-border bg-background/40 p-3 text-center text-sm">
          <span className="text-foreground">{humanize(n.t.sides[0].value)}</span>
          <span className="text-accent-2">⟷</span>
          <span className="text-foreground">{humanize(n.t.sides[1].value)}</span>
        </div>
        <p className="mt-3 text-sm text-foreground/85">
          Both poles run strong in your chart. You hold them at once, rather than settling at the
          midpoint. This is where growth and friction live.
        </p>
      </aside>
    );
  }

  // system
  const s = sysNodes[sel.i];
  const c = computations.find((x) => x.meta.id === s.id);
  if (!c) return <aside className={wrap}>{heading("")}</aside>;
  const cheats = energyCheatSheet(c).slice(0, 3);
  const inThemes = convNodes.filter((n) => n.systemIds.includes(s.id)).length;
  return (
    <aside className={wrap}>
      {heading(s.name)}
      <h3 className="font-display text-xl font-semibold">{s.name}</h3>
      <p className="mt-0.5 text-sm text-muted">reads {GROUP_LABEL[s.derivedFrom] ?? s.derivedFrom}</p>
      <div className="mt-3">
        <SystemDiagram computation={c} />
      </div>
      {cheats.length > 0 && (
        <ul className="mt-1 space-y-1.5">
          {cheats.map((l, i) => (
            <li key={i} className="text-sm leading-relaxed">
              <span className="font-medium text-foreground/90">{l.term}</span>
              <span className="text-muted">: {l.gist}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs text-muted">In {inThemes} cross-confirmed theme(s).</p>
    </aside>
  );
}
