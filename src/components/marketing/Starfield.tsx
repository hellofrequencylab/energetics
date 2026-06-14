/**
 * A light vector starfield. Deterministic (seeded) so the server and client
 * render the same stars, decorative (aria-hidden), and animated with a subtle
 * twinkle. Percentage coordinates keep the dots round at any aspect ratio.
 */

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function Starfield({ count = 40, className }: { count?: number; className?: string }) {
  const rnd = mulberry32(20260614);
  const stars = Array.from({ length: count }, () => ({
    x: rnd() * 100,
    y: rnd() * 100,
    r: 0.4 + rnd() * 1.3,
    dur: 2 + rnd() * 4,
    delay: rnd() * 4,
    min: 0.08 + rnd() * 0.2,
    max: 0.55 + rnd() * 0.4,
  }));

  return (
    <svg
      className={className}
      width="100%"
      height="100%"
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      {stars.map((s, i) => (
        <circle
          key={i}
          cx={`${s.x}%`}
          cy={`${s.y}%`}
          r={s.r}
          fill="var(--star)"
          className="star-twinkle"
          style={
            {
              "--tw-dur": `${s.dur}s`,
              "--tw-delay": `${s.delay}s`,
              "--tw-min": s.min,
              "--tw-max": s.max,
            } as React.CSSProperties
          }
        />
      ))}
    </svg>
  );
}
