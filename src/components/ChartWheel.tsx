import { SIGNS, norm360 } from "@/lib/core/zodiac";
import type { WheelData } from "@/lib/wheel";

/**
 * Shared 360° chart wheel (generative SVG, no image deps, themeable). Renders a
 * zodiac ring, house cusps, planet glyphs by longitude, and aspect lines.
 * Reused by every ephemeris system. Static (reduced-motion friendly).
 */

const SIZE = 420;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R_OUTER = 200;
const R_SIGN_INNER = 168; // inner edge of zodiac band
const R_HOUSE_INNER = 120; // inner circle (aspect hub)
const R_PLANET = 144;
const R_ASPECT = R_HOUSE_INNER;

const ELEMENT_COLOR: Record<string, string> = {
  fire: "#c9774a",
  earth: "#7c9a5a",
  air: "#6aa0cf",
  water: "#7c6cff",
};

const ASPECT_COLOR: Record<string, string> = {
  harmonious: "#7c9a5a",
  challenging: "#c0552f",
  neutral: "#6b6b80",
};

function toXY(longitude: number, radius: number, rotation: number) {
  // Ascendant (rotation) sits at the left; zodiac increases counterclockwise.
  const a = ((180 + (longitude - rotation)) * Math.PI) / 180;
  return { x: CX + radius * Math.cos(a), y: CY - radius * Math.sin(a) };
}

export function ChartWheel({ data }: { data: WheelData }) {
  const rotation = data.ascendant ?? 0;

  // Spread overlapping planets outward so glyphs don't collide.
  const sorted = [...data.planets].sort((a, b) => a.longitude - b.longitude);
  const radii = new Map<string, number>();
  let lastLon = -999;
  let tier = 0;
  for (const p of sorted) {
    tier = Math.abs(norm360(p.longitude - lastLon)) < 8 ? tier + 1 : 0;
    radii.set(p.body, R_PLANET - tier * 16);
    lastLon = p.longitude;
  }
  const posOf = (lon: number) => toXY(lon, R_ASPECT, rotation);

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="mx-auto h-auto w-full max-w-[420px]" role="img" aria-label="Birth chart wheel">
      <circle cx={CX} cy={CY} r={R_OUTER} fill="none" stroke="var(--border)" strokeWidth={1} />
      <circle cx={CX} cy={CY} r={R_SIGN_INNER} fill="none" stroke="var(--border)" strokeWidth={1} />
      <circle cx={CX} cy={CY} r={R_HOUSE_INNER} fill="none" stroke="var(--border)" strokeWidth={1} />

      {/* Zodiac ring: 12 sign sectors */}
      {SIGNS.map((sign) => {
        const start = toXY(sign.index * 30, R_OUTER, rotation);
        const mid = toXY(sign.index * 30 + 15, (R_OUTER + R_SIGN_INNER) / 2, rotation);
        return (
          <g key={sign.index}>
            <line x1={start.x} y1={start.y} x2={toXY(sign.index * 30, R_SIGN_INNER, rotation).x} y2={toXY(sign.index * 30, R_SIGN_INNER, rotation).y} stroke="var(--border)" strokeWidth={1} />
            <text x={mid.x} y={mid.y} dominantBaseline="central" textAnchor="middle" fontSize={16} fill={ELEMENT_COLOR[sign.element]}>
              {sign.glyph}
            </text>
          </g>
        );
      })}

      {/* House cusps */}
      {data.cusps?.map((cusp, i) => {
        const outer = toXY(cusp, R_SIGN_INNER, rotation);
        const inner = toXY(cusp, R_HOUSE_INNER, rotation);
        const isAngle = i === 0 || i === 9; // Asc (1st) and MC (10th)
        const next = data.cusps![(i + 1) % 12];
        const span = norm360(next - cusp);
        const num = toXY(cusp + span / 2, R_HOUSE_INNER + 12, rotation);
        return (
          <g key={`c${i}`}>
            <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="var(--border)" strokeWidth={isAngle ? 2 : 1} opacity={isAngle ? 0.9 : 0.5} />
            <text x={num.x} y={num.y} dominantBaseline="central" textAnchor="middle" fontSize={9} fill="var(--muted)">
              {i + 1}
            </text>
          </g>
        );
      })}

      {/* Aspect lines */}
      {data.aspects.map((asp, i) => {
        const pa = data.planets.find((p) => p.body === asp.a);
        const pb = data.planets.find((p) => p.body === asp.b);
        if (!pa || !pb) return null;
        const xa = posOf(pa.longitude);
        const xb = posOf(pb.longitude);
        return (
          <line key={`a${i}`} x1={xa.x} y1={xa.y} x2={xb.x} y2={xb.y} stroke={ASPECT_COLOR[asp.nature]} strokeWidth={0.8} opacity={0.45} />
        );
      })}

      {/* Planets */}
      {data.planets.map((p) => {
        const r = radii.get(p.body) ?? R_PLANET;
        const pos = toXY(p.longitude, r, rotation);
        const tick = toXY(p.longitude, R_SIGN_INNER, rotation);
        const tickInner = toXY(p.longitude, R_SIGN_INNER - 6, rotation);
        return (
          <g key={p.body}>
            <line x1={tickInner.x} y1={tickInner.y} x2={tick.x} y2={tick.y} stroke="var(--muted)" strokeWidth={1} />
            <text x={pos.x} y={pos.y} dominantBaseline="central" textAnchor="middle" fontSize={15} fill="var(--foreground)">
              {p.glyph}
            </text>
            {p.retrograde && (
              <text x={pos.x + 10} y={pos.y - 8} fontSize={7} fill="var(--accent)">
                ℞
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
