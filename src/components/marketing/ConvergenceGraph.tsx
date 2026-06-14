/**
 * The OneSky signature (docs/DESIGN.md, section 5).
 *
 * Faint threads, each a tradition, enter from the edges and meet at shared nodes
 * near the center, where they brighten. On load the threads draw inward and the
 * nodes light up, one orchestrated moment. The animation is CSS only (see
 * globals.css), so it needs no client JavaScript, and the reduced-motion rule
 * renders the settled state at once. Pass `animated={false}` for the static mark
 * used in the nav and footer.
 *
 * No heavy dependencies, themeable through the --thread-* and --node-glow tokens.
 */

const CENTER: [number, number] = [200, 150];

// The bright shared nodes where threads converge.
const NODES: [number, number][] = [
  [200, 150],
  [176, 134],
  [222, 166],
];

const THREAD_COLORS = [
  "var(--thread-gold)",
  "var(--thread-teal)",
  "var(--thread-violet)",
  "var(--thread-rose)",
];

// Each thread: a far starting point at the edge, and which node it meets.
const THREADS: { from: [number, number]; node: number }[] = [
  { from: [12, 44], node: 1 },
  { from: [24, 250], node: 0 },
  { from: [200, 8], node: 1 },
  { from: [388, 56], node: 2 },
  { from: [372, 244], node: 2 },
  { from: [10, 152], node: 0 },
  { from: [392, 150], node: 2 },
  { from: [120, 292], node: 0 },
];

/** Gentle quadratic curve from an edge point to a node, bowed toward center. */
function curve(from: [number, number], to: [number, number]): string {
  const mx = (from[0] + to[0]) / 2;
  const my = (from[1] + to[1]) / 2;
  const cx = mx + (CENTER[0] - mx) * 0.35;
  const cy = my + (CENTER[1] - my) * 0.35;
  return `M ${from[0]} ${from[1]} Q ${cx} ${cy} ${to[0]} ${to[1]}`;
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
      viewBox="0 0 400 300"
      className={className}
      role="img"
      aria-label={label}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <filter id="cg-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Threads */}
      <g fill="none" strokeWidth="1.25" strokeLinecap="round">
        {THREADS.map((t, i) => {
          const to = NODES[t.node];
          const color = THREAD_COLORS[i % THREAD_COLORS.length];
          return (
            <path
              key={i}
              d={curve(t.from, to)}
              stroke={color}
              strokeOpacity={0.75}
              className={animated ? "cg-thread" : undefined}
              style={animated ? ({ "--cg-delay": `${i * 70}ms` } as React.CSSProperties) : undefined}
            />
          );
        })}
      </g>

      {/* Far points: the distant origin of each tradition. */}
      <g>
        {THREADS.map((t, i) => (
          <circle key={i} cx={t.from[0]} cy={t.from[1]} r={1.6} fill="var(--star)" opacity={0.4} />
        ))}
      </g>

      {/* Shared nodes: the only bright points. */}
      <g filter="url(#cg-glow)">
        {NODES.map((n, i) => (
          <circle
            key={i}
            cx={n[0]}
            cy={n[1]}
            r={i === 0 ? 5 : 3.5}
            fill="var(--node-glow)"
            className={animated ? "cg-node" : undefined}
            style={
              animated
                ? ({ "--cg-node-delay": `${600 + i * 90}ms` } as React.CSSProperties)
                : undefined
            }
          />
        ))}
      </g>
    </svg>
  );
}
