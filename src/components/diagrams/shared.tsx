/**
 * Shared pieces for the per-system diagrams. Every diagram is generative SVG (no
 * image deps), themeable, and static (reduced-motion friendly). Artwork is
 * original and schematic: we draw each tradition's traditional FORM (layout,
 * numerals, structure) from the computed data, not any copyrighted deck or glyph.
 */

/** Five-element colors (Chinese wu xing), reused across diagrams. */
export const ELEMENT_COLOR: Record<string, string> = {
  wood: "#7c9a5a",
  fire: "#c9774a",
  earth: "#c9a24a",
  metal: "#b9b9c4",
  water: "#6aa0cf",
};

/** The four Maya/Dreamspell directional colors. */
export const MAYA_COLOR: Record<string, string> = {
  Red: "#c0552f",
  White: "#e8e4dc",
  Blue: "#6a8fcf",
  Yellow: "#d9b24a",
};

/** A titled frame around a diagram, matching the per-system card styling. */
export function DiagramFrame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <figure className="mb-4 rounded-lg border border-border bg-background/40 p-3">
      <figcaption className="mb-2 text-center text-[10px] uppercase tracking-[0.2em] text-muted">
        {title}
      </figcaption>
      <div className="flex justify-center">{children}</div>
    </figure>
  );
}

/**
 * A galactic tone (1 to 13) as an authentic Maya bar-and-dot numeral: a dot is
 * one, a bar is five. Dots sit above the bars. Drawn in currentColor.
 */
export function ToneNumeral({ tone, unit = 7 }: { tone: number; unit?: number }) {
  const v = Math.max(0, Math.min(13, Math.round(tone)));
  const bars = Math.floor(v / 5);
  const dots = v % 5;
  const barW = unit * 5;
  const barH = unit * 0.7;
  const gap = unit * 0.5;
  const dotR = unit * 0.45;

  const width = barW;
  const dotRowH = dots > 0 ? unit * 1.4 : 0;
  const barsH = bars > 0 ? bars * (barH + gap) : 0;
  const height = Math.max(unit, dotRowH + barsH);

  const dotSpacing = dots > 1 ? Math.min(unit * 1.6, barW / dots) : 0;
  const dotsTotalW = dots > 0 ? dotSpacing * (dots - 1) : 0;
  const dotStartX = (width - dotsTotalW) / 2;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      {Array.from({ length: dots }).map((_, i) => (
        <circle key={`d${i}`} cx={dots === 1 ? width / 2 : dotStartX + i * dotSpacing} cy={unit * 0.7} r={dotR} fill="currentColor" />
      ))}
      {Array.from({ length: bars }).map((_, i) => (
        <rect
          key={`b${i}`}
          x={0}
          y={dotRowH + i * (barH + gap)}
          width={barW}
          height={barH}
          rx={barH / 2}
          fill="currentColor"
        />
      ))}
    </svg>
  );
}
