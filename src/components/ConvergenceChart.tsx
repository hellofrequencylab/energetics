"use client";

import { useMemo, useState } from "react";
import type { Convergence, Synthesis, Tension } from "@/lib/synthesis/types";

/**
 * The Convergence Chart: the flagship visual of the reading. Systems sit on an
 * outer ring, colored by their independence group (sky, calendar, name). Each
 * convergence is a node pulled toward the center in proportion to how many
 * independent groups agree, with threads to the systems that voted for it.
 * Tensions arc between the poles two systems pull apart. Every point is clickable
 * for a details popover. Pure client SVG, themeable, keyboard accessible.
 */

const VW = 640;
const VH = 640;
const C = { x: 320, y: 320 };
const R_SYS = 250; // outer ring radius for system nodes

const GROUP_COLOR: Record<string, string> = {
  ephemeris: "#6aa0cf", // the sky
  date: "#d4b072", // the calendar
  name: "#8b7dff", // the name
};
const GROUP_LABEL: Record<string, string> = {
  ephemeris: "Sky",
  date: "Calendar",
  name: "Name",
};
const GOLD = "#d4b072";
const VIOLET = "#8b7dff";
const SELF = "#f3d9a8";
const THREAD = "#4a4358";

function humanize(value: string): string {
  const bare = value.includes(":") ? value.split(":")[1] : value;
  return bare.charAt(0).toUpperCase() + bare.slice(1);
}

interface SystemNode {
  id: string;
  name: string;
  derivedFrom: string;
  x: number;
  y: number;
}

type Selection =
  | { kind: "self" }
  | { kind: "system"; i: number }
  | { kind: "convergence"; i: number }
  | { kind: "tension"; i: number };

export function ConvergenceChart({
  synthesis,
  systems,
  selfName,
}: {
  synthesis: Synthesis;
  systems: { id: string; name: string; derivedFrom: string }[];
  selfName: string;
}) {
  const [sel, setSel] = useState<Selection | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  // Place systems evenly around the ring (top first), and index them.
  const sysNodes: SystemNode[] = useMemo(() => {
    const n = Math.max(systems.length, 1);
    return systems.map((s, i) => {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      return { ...s, x: C.x + Math.cos(a) * R_SYS, y: C.y + Math.sin(a) * R_SYS };
    });
  }, [systems]);
  const posOf = useMemo(() => new Map(sysNodes.map((s) => [s.id, s])), [sysNodes]);

  // A convergence node sits at the average of its systems, pulled toward center.
  const convNodes = useMemo(() => {
    return synthesis.convergences
      .map((cv, i) => {
        const pts = [...new Set(cv.contributors.map((a) => a.systemId))]
          .map((id) => posOf.get(id))
          .filter((p): p is SystemNode => !!p);
        if (!pts.length) return null;
        const ax = pts.reduce((s, p) => s + p.x, 0) / pts.length;
        const ay = pts.reduce((s, p) => s + p.y, 0) / pts.length;
        const x = C.x + (ax - C.x) * 0.62;
        const y = C.y + (ay - C.y) * 0.62;
        return { cv, i, x, y, systemIds: pts.map((p) => p.id) };
      })
      .filter((n): n is { cv: Convergence; i: number; x: number; y: number; systemIds: string[] } => !!n);
  }, [synthesis.convergences, posOf]);

  // Tension poles: centroid of each side's contributing systems.
  const tensionArcs = useMemo(() => {
    const centroid = (ids: string[]) => {
      const pts = ids.map((id) => posOf.get(id)).filter((p): p is SystemNode => !!p);
      if (!pts.length) return null;
      return {
        x: C.x + (pts.reduce((s, p) => s + p.x, 0) / pts.length - C.x) * 0.62,
        y: C.y + (pts.reduce((s, p) => s + p.y, 0) / pts.length - C.y) * 0.62,
      };
    };
    return synthesis.tensions
      .map((t, i) => {
        const a = centroid([...new Set(t.sides[0].contributors.map((c) => c.systemId))]);
        const b = centroid([...new Set(t.sides[1].contributors.map((c) => c.systemId))]);
        if (!a || !b) return null;
        return { t, i, a, b };
      })
      .filter((n): n is { t: Tension; i: number; a: { x: number; y: number }; b: { x: number; y: number } } => !!n);
  }, [synthesis.tensions, posOf]);

  const isDim = (systemId: string) =>
    hovered != null && hovered !== systemId && !hovered.startsWith("conv:");

  const keyActivate = (fn: () => void) => (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fn();
    }
  };

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        className="w-full"
        role="img"
        aria-label="Convergence chart: systems, where they agree, and where they pull apart"
      >
        {/* faint guide rings */}
        <circle cx={C.x} cy={C.y} r={R_SYS} fill="none" stroke={THREAD} strokeOpacity={0.3} />
        <circle cx={C.x} cy={C.y} r={R_SYS * 0.62} fill="none" stroke={THREAD} strokeOpacity={0.18} />

        {/* convergence threads */}
        {convNodes.map((n) => {
          const strong = n.cv.independentGroups >= 2;
          return n.systemIds.map((sid) => {
            const p = posOf.get(sid)!;
            const active = hovered === `conv:${n.i}` || hovered === sid;
            return (
              <line
                key={`t${n.i}-${sid}`}
                x1={n.x}
                y1={n.y}
                x2={p.x}
                y2={p.y}
                stroke={strong ? GOLD : THREAD}
                strokeWidth={active ? 2.4 : strong ? 1.4 : 0.8}
                strokeOpacity={active ? 0.95 : strong ? 0.5 : 0.25}
              />
            );
          });
        })}

        {/* tension arcs */}
        {tensionArcs.map((n) => {
          const active = hovered === `tension:${n.i}`;
          return (
            <line
              key={`x${n.i}`}
              x1={n.a.x}
              y1={n.a.y}
              x2={n.b.x}
              y2={n.b.y}
              stroke={VIOLET}
              strokeWidth={active ? 2.6 : 1.4}
              strokeOpacity={active ? 0.95 : 0.5}
              strokeDasharray="5 5"
            />
          );
        })}

        {/* system nodes */}
        {sysNodes.map((s, i) => {
          const color = GROUP_COLOR[s.derivedFrom] ?? "#8a89a0";
          const labelRight = s.x >= C.x;
          return (
            <g
              key={s.id}
              role="button"
              tabIndex={0}
              aria-label={`${s.name}, reads from the ${GROUP_LABEL[s.derivedFrom] ?? s.derivedFrom}`}
              className="cursor-pointer focus:outline-none"
              onClick={() => setSel({ kind: "system", i })}
              onKeyDown={keyActivate(() => setSel({ kind: "system", i }))}
              onMouseEnter={() => setHovered(s.id)}
              onMouseLeave={() => setHovered(null)}
              opacity={isDim(s.id) ? 0.4 : 1}
            >
              <circle cx={s.x} cy={s.y} r={9} fill={color} fillOpacity={0.9} stroke="#0e0b12" strokeWidth={1.5} />
              <text
                x={s.x + (labelRight ? 14 : -14)}
                y={s.y + 4}
                textAnchor={labelRight ? "start" : "end"}
                fontSize={12}
                fill="#cfc9d6"
              >
                {s.name}
              </text>
            </g>
          );
        })}

        {/* convergence nodes */}
        {convNodes.map((n) => {
          const strong = n.cv.independentGroups >= 2;
          const r = strong ? 7 + Math.min(n.cv.independentGroups, 4) * 2 : 4;
          return (
            <g
              key={`c${n.i}`}
              role="button"
              tabIndex={0}
              aria-label={`${humanize(n.cv.value)}, ${n.cv.independentGroups} independent source${n.cv.independentGroups === 1 ? "" : "s"}`}
              className="cursor-pointer focus:outline-none"
              onClick={() => setSel({ kind: "convergence", i: n.i })}
              onKeyDown={keyActivate(() => setSel({ kind: "convergence", i: n.i }))}
              onMouseEnter={() => setHovered(`conv:${n.i}`)}
              onMouseLeave={() => setHovered(null)}
            >
              {strong && <circle cx={n.x} cy={n.y} r={r + 5} fill={GOLD} fillOpacity={0.12} />}
              <circle
                cx={n.x}
                cy={n.y}
                r={r}
                fill={strong ? GOLD : "#2a2438"}
                fillOpacity={strong ? 0.92 : 1}
                stroke={GOLD}
                strokeWidth={strong ? 0 : 1.2}
                strokeOpacity={0.7}
              />
            </g>
          );
        })}

        {/* tension pole markers */}
        {tensionArcs.map((n) => (
          <g
            key={`xp${n.i}`}
            role="button"
            tabIndex={0}
            aria-label={`Tension on ${n.t.axis}`}
            className="cursor-pointer focus:outline-none"
            onClick={() => setSel({ kind: "tension", i: n.i })}
            onKeyDown={keyActivate(() => setSel({ kind: "tension", i: n.i }))}
            onMouseEnter={() => setHovered(`tension:${n.i}`)}
            onMouseLeave={() => setHovered(null)}
          >
            <rect x={n.a.x - 4} y={n.a.y - 4} width={8} height={8} fill={VIOLET} transform={`rotate(45 ${n.a.x} ${n.a.y})`} />
            <rect x={n.b.x - 4} y={n.b.y - 4} width={8} height={8} fill={VIOLET} transform={`rotate(45 ${n.b.x} ${n.b.y})`} />
          </g>
        ))}

        {/* self node */}
        <g
          role="button"
          tabIndex={0}
          aria-label={`${selfName}, the center of the chart`}
          className="cursor-pointer focus:outline-none"
          onClick={() => setSel({ kind: "self" })}
          onKeyDown={keyActivate(() => setSel({ kind: "self" }))}
        >
          <circle cx={C.x} cy={C.y} r={22} fill={SELF} fillOpacity={0.16} />
          <circle cx={C.x} cy={C.y} r={11} fill={SELF} />
          <text x={C.x} y={C.y + 38} textAnchor="middle" fontSize={13} fontWeight={600} fill="#f3eee7">
            {selfName}
          </text>
        </g>
      </svg>

      {sel && (
        <Popover
          sel={sel}
          synthesis={synthesis}
          sysNodes={sysNodes}
          convNodes={convNodes}
          tensionArcs={tensionArcs}
          nameOf={(id) => systems.find((s) => s.id === id)?.name ?? id}
          selfName={selfName}
          onClose={() => setSel(null)}
        />
      )}

      <Legend />
    </div>
  );
}

function Legend() {
  const item = (color: string, label: string, ring = false) => (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={ring ? { border: `2px solid ${color}` } : { background: color }}
      />
      {label}
    </span>
  );
  return (
    <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-xs text-muted">
      {item(GOLD, "Cross-confirmed")}
      {item(GOLD, "Single source", true)}
      {item(VIOLET, "Tension")}
      {item("#6aa0cf", "Sky")}
      {item("#d4b072", "Calendar")}
      {item("#8b7dff", "Name")}
    </div>
  );
}

function Popover({
  sel,
  synthesis,
  sysNodes,
  convNodes,
  tensionArcs,
  nameOf,
  selfName,
  onClose,
}: {
  sel: Selection;
  synthesis: Synthesis;
  sysNodes: SystemNode[];
  convNodes: { cv: Convergence; i: number; x: number; y: number; systemIds: string[] }[];
  tensionArcs: { t: Tension; i: number; a: { x: number; y: number }; b: { x: number; y: number } }[];
  nameOf: (id: string) => string;
  selfName: string;
  onClose: () => void;
}) {
  let at = { x: C.x, y: C.y };
  let title = "";
  let body: React.ReactNode = null;

  if (sel.kind === "self") {
    title = selfName;
    body = (
      <p>
        {synthesis.convergences.length} convergence{synthesis.convergences.length === 1 ? "" : "s"} and{" "}
        {synthesis.tensions.length} tension{synthesis.tensions.length === 1 ? "" : "s"} across {sysNodes.length} systems.
      </p>
    );
  } else if (sel.kind === "system") {
    const s = sysNodes[sel.i];
    at = { x: s.x, y: s.y };
    const inConv = convNodes.filter((n) => n.systemIds.includes(s.id)).length;
    title = s.name;
    body = (
      <p>
        Reads from the {GROUP_LABEL[s.derivedFrom] ?? s.derivedFrom}. Part of {inConv} convergence
        {inConv === 1 ? "" : "s"} in this reading.
      </p>
    );
  } else if (sel.kind === "convergence") {
    const n = convNodes.find((c) => c.i === sel.i)!;
    at = { x: n.x, y: n.y };
    title = humanize(n.cv.value);
    body = (
      <>
        <p className="text-muted">{n.cv.axis}</p>
        <p className="mt-1">
          {n.cv.independentGroups} independent source group{n.cv.independentGroups === 1 ? "" : "s"} agree.
        </p>
        <p className="mt-1 text-muted">{n.systemIds.map(nameOf).join(" · ")}</p>
      </>
    );
  } else {
    const n = tensionArcs.find((t) => t.i === sel.i)!;
    at = { x: (n.a.x + n.b.x) / 2, y: (n.a.y + n.b.y) / 2 };
    title = "Tension";
    body = (
      <>
        <p className="text-muted">{n.t.axis}</p>
        <p className="mt-1">
          <span className="text-foreground">{humanize(n.t.sides[0].value)}</span> pulls against{" "}
          <span className="text-foreground">{humanize(n.t.sides[1].value)}</span>. Both are held, not averaged.
        </p>
      </>
    );
  }

  const left = `${(at.x / VW) * 100}%`;
  const top = `${(at.y / VH) * 100}%`;

  return (
    <div
      className="absolute z-10 w-56 -translate-x-1/2 -translate-y-full rounded-xl border border-border bg-surface/95 p-3 text-sm shadow-xl backdrop-blur"
      style={{ left, top, marginTop: -10 }}
      role="dialog"
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-semibold text-foreground">{title}</h4>
        <button onClick={onClose} aria-label="Close" className="text-muted transition hover:text-foreground">
          ✕
        </button>
      </div>
      <div className="mt-1 text-foreground/85">{body}</div>
    </div>
  );
}
