import { ELEMENT_COLOR } from "./shared";

/**
 * The Chinese BaZi chart: four pillars (year, month, day, hour), each a heavenly
 * stem above an earthly branch, colored by the stem's element. The day pillar is
 * marked, since its stem is the Day Master (the self). Drawn from native data.
 */

interface Pillar {
  stem: string;
  branch: string;
  element: string;
  polarity: string;
  animal: string;
}

const ORDER: { key: keyof Pillars; label: string }[] = [
  { key: "year", label: "Year" },
  { key: "month", label: "Month" },
  { key: "day", label: "Day" },
  { key: "hour", label: "Hour" },
];

export interface Pillars {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  hour: Pillar;
}

const COL_W = 70;
const GAP = 8;
const W = 4 * COL_W + 3 * GAP;

export function FourPillars({ pillars }: { pillars: Pillars }) {
  return (
    <svg width={W} height={208} viewBox={`0 0 ${W} 208`} role="img" aria-label="BaZi four pillars">
      {ORDER.map((col, i) => {
        const p = pillars[col.key];
        const x = i * (COL_W + GAP);
        const color = ELEMENT_COLOR[p.element] ?? "#6b6b80";
        const isDay = col.key === "day";
        return (
          <g key={col.key}>
            <text x={x + COL_W / 2} y={14} textAnchor="middle" fontSize={10} fill="#8a89a0">
              {col.label}
              {isDay ? " ★" : ""}
            </text>

            {/* Heavenly stem */}
            <rect x={x} y={24} width={COL_W} height={74} rx={8} fill={color} fillOpacity={0.85} stroke={color} />
            <text x={x + COL_W / 2} y={62} textAnchor="middle" fontSize={34} fill="#1a1410" fontWeight={600}>
              {p.stem}
            </text>
            <text x={x + COL_W / 2} y={86} textAnchor="middle" fontSize={9} fill="#1a1410" fillOpacity={0.8}>
              {p.polarity} {cap(p.element)}
            </text>

            {/* Earthly branch */}
            <rect
              x={x}
              y={104}
              width={COL_W}
              height={86}
              rx={8}
              fill="transparent"
              stroke={color}
              strokeOpacity={0.8}
            />
            <text x={x + COL_W / 2} y={146} textAnchor="middle" fontSize={34} fill={color} fontWeight={600}>
              {p.branch}
            </text>
            <text x={x + COL_W / 2} y={170} textAnchor="middle" fontSize={10} fill="#cfcde0">
              {p.animal}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function cap(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}
