/**
 * The OneSky signature (docs/DESIGN.md, section 5).
 *
 * Faint threads, each a tradition, enter from every direction and converge on a
 * small cluster of shared nodes that glow. Threads are generated evenly around
 * the perimeter for a balanced, deliberate burst (not a random scatter). The
 * entrance animation is CSS only (globals.css), reduced-motion safe; pass
 * `animated={false}` for the static mark in the nav and footer.
 *
 * Themeable through the --thread-* and --node-glow tokens. No dependencies.
 */

const CX = 200;
const CY = 158;

// The bright shared nodes where threads converge.
const NODES: [number, number][] = [
  [200, 158],
  [177, 143],
  [223, 174],
];

const THREAD_COLORS = [
  "var(--thread-gold)",
  "var(--thread-teal)",
  "var(--thread-violet)",
  "var(--thread-rose)",
];

const COUNT = 16;

// Evenly distributed entry points around an ellipse, each meeting a node.
const THREADS = Array.from({ length: COUNT }, (_, i) => {
  const angle = (i / COUNT) * Math.PI * 2 + 0.35;
  const from: [number, number] = [CX + Math.cos(angle) * 212, CY + Math.sin(angle) * 150];
  return { from, node: i % NODES.length, color: THREAD_COLORS[i % THREAD_COLORS.length], delay: i * 50 };
});

/** A gentle quadratic curve from an edge point to a node, bowed toward center. */
function curve(from: [number, number], to: [number, number]): string {
  const mx = (from[0] + to[0]) / 2;
  const my = (from[1] + to[1]) / 2;
  const cx = mx + (CX - mx) * 0.4;
  const cy = my + (CY - my) * 0.4;
  return `M ${from[0].toFixed(1)} ${from[1].toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${to[0]} ${to[1]}`;
}

export function ConvergenceGraph({
  animated = true,
  className,
  label = "Threads from many traditions converging to shared points of light.",
}: {
  animated?: boolean;
  className?: string;
  label?: string;
}) {
  return (
    <svg
      viewBox="0 0 400 320"
      className={className}
      role="img"
      aria-label={label}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <filter id="cg-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id="cg-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--node-glow)" stopOpacity="0.28" />
          <stop offset="55%" stopColor="var(--node-glow)" stopOpacity="0.06" />
          <stop offset="100%" stopColor="var(--node-glow)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Soft halo behind the cluster */}
      <circle cx={CX} cy={CY} r="120" fill="url(#cg-halo)" className={animated ? "float" : undefined} />

      {/* Threads */}
      <g fill="none" strokeWidth="1.1" strokeLinecap="round">
        {THREADS.map((t, i) => (
          <path
            key={i}
            d={curve(t.from, NODES[t.node])}
            stroke={t.color}
            strokeOpacity={0.7}
            className={animated ? "cg-thread" : undefined}
            style={animated ? ({ "--cg-delay": `${t.delay}ms` } as React.CSSProperties) : undefined}
          />
        ))}
      </g>

      {/* Far points: the distant origin of each tradition */}
      <g>
        {THREADS.map((t, i) => (
          <circle key={i} cx={t.from[0]} cy={t.from[1]} r={1.4} fill="var(--star)" opacity={0.45} />
        ))}
      </g>

      {/* Shared nodes: the only bright points */}
      <g filter="url(#cg-glow)">
        {NODES.map((n, i) => (
          <circle
            key={i}
            cx={n[0]}
            cy={n[1]}
            r={i === 0 ? 5.5 : 3.5}
            fill="var(--node-glow)"
            className={animated ? "cg-node" : undefined}
            style={animated ? ({ "--cg-node-delay": `${650 + i * 90}ms` } as React.CSSProperties) : undefined}
          />
        ))}
      </g>
    </svg>
  );
}
