import { cn } from "@/lib/ui/cn";

/**
 * The sand/convergence motif, packaged for reuse: faint origin points around the
 * edge, gold threads curving inward, and a glowing shared node at the center. It
 * is the site's signature visual language (see the convergence map and the
 * per-system diagrams) distilled into a small, static, themeable mark for empty
 * states, section headers, auth, and 404. No animation, no dependencies.
 */
export function SandMark({ className }: { className?: string }) {
  const cx = 60;
  const cy = 40;
  const n = 7;
  const threads = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    const ox = cx + Math.cos(a) * 54;
    const oy = cy + Math.sin(a) * 32;
    // Control point pulled toward the center for a gentle inward bow.
    const mx = cx + Math.cos(a) * 18;
    const my = cy + Math.sin(a) * 11;
    return { ox, oy, mx, my };
  });
  return (
    <svg
      viewBox="0 0 120 80"
      className={cn("text-accent", className)}
      role="img"
      aria-hidden="true"
      fill="none"
    >
      {threads.map((t, i) => (
        <g key={i}>
          <path
            d={`M ${t.ox} ${t.oy} Q ${t.mx} ${t.my} ${cx} ${cy}`}
            stroke="currentColor"
            strokeWidth={1}
            strokeOpacity={0.45}
            strokeLinecap="round"
          />
          <circle cx={t.ox} cy={t.oy} r={1.6} fill="currentColor" fillOpacity={0.5} />
        </g>
      ))}
      <circle cx={cx} cy={cy} r={9} fill="var(--node-glow)" fillOpacity={0.16} />
      <circle cx={cx} cy={cy} r={4.5} fill="var(--node-glow)" />
    </svg>
  );
}
