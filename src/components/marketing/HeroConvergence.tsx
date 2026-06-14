"use client";

import { useEffect, useRef } from "react";

/**
 * The interactive hero field: many points spread across the hero, their threads
 * converging on a bright central cluster that follows the cursor and drifts on
 * its own. Sits behind the headline.
 *
 * Animated entirely by mutating SVG attributes in a rAF loop (no React state
 * churn). The viewBox is kept equal to the pixel size so coordinates map 1:1 to
 * the cursor. Reduced motion renders a single settled frame, no loop, no follow.
 */

const COLORS = [
  "var(--thread-gold)",
  "var(--thread-teal)",
  "var(--thread-violet)",
  "var(--thread-rose)",
];
const POINTS = 22;
const NODE_OFFSETS: [number, number][] = [
  [0, 0],
  [-22, -16],
  [24, 18],
];

function mulberry32(seed: number) {
  return function () {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Deterministic spread of points (fractions of the hero) and node assignment.
// Each far point also gets a star-like size and twinkle so it sits among the sky.
const FIELD = Array.from({ length: POINTS }, (_, i) => {
  const rnd = mulberry32(1000 + i * 7);
  const a = rnd();
  const b = rnd();
  const c = rnd();
  const d = rnd();
  const e = rnd();
  return {
    fx: 0.04 + a * 0.92,
    fy: 0.06 + b * 0.88,
    node: i % NODE_OFFSETS.length,
    color: COLORS[i % COLORS.length],
    r: 1 + c * 1.8,
    twDur: 2.5 + d * 4,
    twDelay: e * 5,
  };
});

export function HeroConvergence({ className }: { className?: string }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const farRefs = useRef<(SVGCircleElement | null)[]>([]);
  const nodeRefs = useRef<(SVGCircleElement | null)[]>([]);
  const haloRef = useRef<SVGCircleElement | null>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 1;
    let h = 1;
    const cluster = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };
    let homeX = 0;
    let homeY = 0;
    let haveMouse = false;

    function measure() {
      const r = svg!.getBoundingClientRect();
      w = Math.max(1, r.width);
      h = Math.max(1, r.height);
      svg!.setAttribute("viewBox", `0 0 ${w} ${h}`);
      homeX = w * 0.5;
      homeY = h * 0.44;
      if (!haveMouse) {
        target.x = homeX;
        target.y = homeY;
      }
      if (cluster.x === 0 && cluster.y === 0) {
        cluster.x = homeX;
        cluster.y = homeY;
      }
    }

    function onMove(e: MouseEvent) {
      const r = svg!.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      if (x < 0 || y < 0 || x > r.width || y > r.height) return;
      haveMouse = true;
      target.x = Math.min(w * 0.9, Math.max(w * 0.1, x));
      target.y = Math.min(h * 0.88, Math.max(h * 0.12, y));
    }

    function frame(now: number) {
      cluster.x += (target.x - cluster.x) * 0.06;
      cluster.y += (target.y - cluster.y) * 0.06;
      const t = now * 0.001;

      const nodeAbs = NODE_OFFSETS.map((o, i) => {
        const dx = Math.sin(t * 0.7 + i * 1.7) * 7;
        const dy = Math.cos(t * 0.9 + i * 2.3) * 7;
        return [cluster.x + o[0] + dx, cluster.y + o[1] + dy] as [number, number];
      });
      nodeAbs.forEach((n, i) => {
        const c = nodeRefs.current[i];
        if (c) {
          c.setAttribute("cx", n[0].toFixed(1));
          c.setAttribute("cy", n[1].toFixed(1));
        }
      });
      if (haloRef.current) {
        haloRef.current.setAttribute("cx", cluster.x.toFixed(1));
        haloRef.current.setAttribute("cy", cluster.y.toFixed(1));
      }
      FIELD.forEach((p, j) => {
        const px = p.fx * w;
        const py = p.fy * h;
        const far = farRefs.current[j];
        if (far) {
          far.setAttribute("cx", px.toFixed(1));
          far.setAttribute("cy", py.toFixed(1));
        }
        const n = nodeAbs[p.node];
        const mx = (px + n[0]) / 2 + (cluster.x - (px + n[0]) / 2) * 0.3;
        const my = (py + n[1]) / 2 + (cluster.y - (py + n[1]) / 2) * 0.3;
        const path = pathRefs.current[j];
        if (path) {
          path.setAttribute(
            "d",
            `M ${px.toFixed(1)} ${py.toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${n[0].toFixed(1)} ${n[1].toFixed(1)}`,
          );
        }
      });
    }

    measure();

    if (reduce) {
      frame(0);
      const onResize = () => {
        measure();
        frame(0);
      };
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }

    let raf = 0;
    const loop = (now: number) => {
      frame(now);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <svg ref={svgRef} className={className} aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <defs>
        <filter id="hc-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id="hc-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--node-glow)" stopOpacity="0.22" />
          <stop offset="60%" stopColor="var(--node-glow)" stopOpacity="0.05" />
          <stop offset="100%" stopColor="var(--node-glow)" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle ref={haloRef} r="170" fill="url(#hc-halo)" />

      <g fill="none" strokeWidth="1" strokeLinecap="round">
        {FIELD.map((p, j) => (
          <path
            key={j}
            ref={(el) => {
              pathRefs.current[j] = el;
            }}
            stroke={p.color}
            strokeOpacity={0.5}
          />
        ))}
      </g>

      <g>
        {FIELD.map((p, j) => (
          <circle
            key={j}
            ref={(el) => {
              farRefs.current[j] = el;
            }}
            r={p.r}
            fill="var(--star)"
            className="star-twinkle"
            style={
              {
                "--tw-dur": `${p.twDur}s`,
                "--tw-delay": `${p.twDelay}s`,
                "--tw-min": 0.15,
                "--tw-max": 0.85,
              } as React.CSSProperties
            }
          />
        ))}
      </g>

      <g filter="url(#hc-glow)">
        {NODE_OFFSETS.map((_, i) => (
          <circle
            key={i}
            ref={(el) => {
              nodeRefs.current[i] = el;
            }}
            r={i === 0 ? 6 : 4}
            fill="var(--node-glow)"
          />
        ))}
      </g>
    </svg>
  );
}
