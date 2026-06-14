import { CHANNELS, GATE_CENTER, type CenterId } from "@/lib/systems/human-design/data";

/**
 * The Human Design BodyGraph: nine centers in their canonical positions and
 * shapes, with the 36 channels between them. Defined centers are filled and their
 * defined channels are lit; the rest stay open. Original schematic geometry.
 */

type Shape = "triUp" | "triDown" | "square" | "diamond" | "triLeft" | "triRight";

const POS: Record<CenterId, { x: number; y: number; r: number; shape: Shape }> = {
  Head: { x: 150, y: 34, r: 26, shape: "triUp" },
  Ajna: { x: 150, y: 104, r: 26, shape: "triDown" },
  Throat: { x: 150, y: 176, r: 30, shape: "square" },
  G: { x: 150, y: 258, r: 30, shape: "diamond" },
  Heart: { x: 224, y: 250, r: 22, shape: "triLeft" },
  Spleen: { x: 58, y: 330, r: 26, shape: "triRight" },
  SolarPlexus: { x: 242, y: 330, r: 26, shape: "triLeft" },
  Sacral: { x: 150, y: 348, r: 30, shape: "square" },
  Root: { x: 150, y: 430, r: 30, shape: "square" },
};

const ACCENT = "#c9a24a";
const OPEN = "#3a3850";

function shapePath(x: number, y: number, r: number, shape: Shape): string {
  switch (shape) {
    case "triUp":
      return `M ${x} ${y - r} L ${x + r} ${y + r} L ${x - r} ${y + r} Z`;
    case "triDown":
      return `M ${x} ${y + r} L ${x + r} ${y - r} L ${x - r} ${y - r} Z`;
    case "triLeft":
      return `M ${x - r} ${y} L ${x + r} ${y - r} L ${x + r} ${y + r} Z`;
    case "triRight":
      return `M ${x + r} ${y} L ${x - r} ${y - r} L ${x - r} ${y + r} Z`;
    case "diamond":
      return `M ${x} ${y - r} L ${x + r} ${y} L ${x} ${y + r} L ${x - r} ${y} Z`;
    case "square":
    default:
      return `M ${x - r} ${y - r} h ${2 * r} v ${2 * r} h ${-2 * r} Z`;
  }
}

export function BodyGraph({
  centers,
  channels,
}: {
  centers: Record<string, boolean>;
  channels: string[];
}) {
  const definedChannels = new Set(channels);

  return (
    <svg width={300} height={464} viewBox="0 0 300 464" role="img" aria-label="Human Design bodygraph">
      {/* Channels first, behind the centers. */}
      {CHANNELS.map(([a, b], i) => {
        const ca = GATE_CENTER[a];
        const cb = GATE_CENTER[b];
        if (!ca || !cb || ca === cb) return null;
        const pa = POS[ca];
        const pb = POS[cb];
        const lit = definedChannels.has(`${a}-${b}`) || definedChannels.has(`${b}-${a}`);
        return (
          <line
            key={i}
            x1={pa.x}
            y1={pa.y}
            x2={pb.x}
            y2={pb.y}
            stroke={lit ? ACCENT : OPEN}
            strokeWidth={lit ? 3 : 1}
            strokeOpacity={lit ? 0.9 : 0.5}
          />
        );
      })}

      {/* Centers. */}
      {(Object.keys(POS) as CenterId[]).map((c) => {
        const p = POS[c];
        const on = centers[c];
        return (
          <g key={c}>
            <path
              d={shapePath(p.x, p.y, p.r, p.shape)}
              fill={on ? ACCENT : "transparent"}
              fillOpacity={on ? 0.85 : 1}
              stroke={on ? ACCENT : OPEN}
              strokeWidth={1.5}
            />
            <text
              x={p.x}
              y={p.y + 3}
              textAnchor="middle"
              fontSize={8}
              fill={on ? "#1a1410" : "#8a89a0"}
              style={{ pointerEvents: "none" }}
            >
              {LABEL[c]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

const LABEL: Record<CenterId, string> = {
  Head: "Head",
  Ajna: "Ajna",
  Throat: "Throat",
  G: "G",
  Heart: "Heart",
  Spleen: "Spleen",
  SolarPlexus: "Solar",
  Sacral: "Sacral",
  Root: "Root",
};
