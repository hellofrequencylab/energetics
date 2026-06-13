import { angularSeparation } from "@/lib/core/zodiac";

export type AspectType = "conjunction" | "sextile" | "square" | "trine" | "opposition";

interface AspectDef {
  type: AspectType;
  angle: number;
  baseOrb: number;
}

// Major (Ptolemaic) aspects. Luminaries (Sun/Moon) get a wider orb (spec §8.4).
const ASPECTS: AspectDef[] = [
  { type: "conjunction", angle: 0, baseOrb: 8 },
  { type: "opposition", angle: 180, baseOrb: 7 },
  { type: "trine", angle: 120, baseOrb: 7 },
  { type: "square", angle: 90, baseOrb: 6 },
  { type: "sextile", angle: 60, baseOrb: 5 },
];

const LUMINARY_BONUS = 2;

export interface AspectBody {
  body: string;
  longitude: number;
  speed: number;
}

export interface Aspect {
  a: string;
  b: string;
  type: AspectType;
  orb: number;
  applying: boolean;
}

function isLuminary(body: string): boolean {
  return body === "sun" || body === "moon";
}

/**
 * Detect major aspects between bodies within orb. `applying` is true when the
 * aspect is tightening (orb smaller a small step ahead, using current speeds).
 */
export function computeAspects(bodies: AspectBody[]): Aspect[] {
  const aspects: Aspect[] = [];
  const dt = 0.05; // days lookahead for applying/separating

  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const a = bodies[i];
      const b = bodies[j];
      const sep = angularSeparation(a.longitude, b.longitude);
      const orbAllowance = isLuminary(a.body) || isLuminary(b.body) ? LUMINARY_BONUS : 0;

      let best: { def: AspectDef; orb: number } | null = null;
      for (const def of ASPECTS) {
        const orb = Math.abs(sep - def.angle);
        if (orb <= def.baseOrb + orbAllowance && (!best || orb < best.orb)) best = { def, orb };
      }
      if (!best) continue;

      const sepNext = angularSeparation(a.longitude + a.speed * dt, b.longitude + b.speed * dt);
      const orbNext = Math.abs(sepNext - best.def.angle);
      aspects.push({
        a: a.body,
        b: b.body,
        type: best.def.type,
        orb: Number(best.orb.toFixed(2)),
        applying: orbNext < best.orb,
      });
    }
  }
  return aspects.sort((x, y) => x.orb - y.orb);
}
