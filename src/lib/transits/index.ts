/**
 * Transits — the current (or a given date's) sky read against the natal chart,
 * powering "daily / seasonal" guidance. Reuses the shared ephemeris and the
 * natal Western placements. NODE RUNTIME ONLY (loads the ephemeris).
 */
import type { CoreBody, NativeResult } from "@/lib/core/contracts";
import { getEphemeris } from "@/lib/core/ephemeris";
import { angularSeparation, norm360, toSignPosition } from "@/lib/core/zodiac";

export interface TransitHit {
  transiting: string;
  natal: string;
  aspect: string;
  orb: number;
  applying: boolean;
}

export interface TransitsResult {
  date: string; // ISO instant used
  season: { sunSign: string; moonSign: string; moonPhase: string };
  hits: TransitHit[];
}

const TRANSIT_BODIES: { id: string; body: CoreBody; label: string }[] = [
  { id: "Sun", body: "sun", label: "Sun" },
  { id: "Moon", body: "moon", label: "Moon" },
  { id: "Mercury", body: "mercury", label: "Mercury" },
  { id: "Venus", body: "venus", label: "Venus" },
  { id: "Mars", body: "mars", label: "Mars" },
  { id: "Jupiter", body: "jupiter", label: "Jupiter" },
  { id: "Saturn", body: "saturn", label: "Saturn" },
  { id: "Uranus", body: "uranus", label: "Uranus" },
  { id: "Neptune", body: "neptune", label: "Neptune" },
  { id: "Pluto", body: "pluto", label: "Pluto" },
];

const ASPECTS = [
  { type: "conjunction", angle: 0, orb: 3 },
  { type: "opposition", angle: 180, orb: 3 },
  { type: "trine", angle: 120, orb: 3 },
  { type: "square", angle: 90, orb: 3 },
  { type: "sextile", angle: 60, orb: 2 },
];

const PHASES = [
  "New Moon", "Waxing Crescent", "First Quarter", "Waxing Gibbous",
  "Full Moon", "Waning Gibbous", "Last Quarter", "Waning Crescent",
];

const NATAL_LABEL: Record<string, string> = {
  sun: "Sun", moon: "Moon", mercury: "Mercury", venus: "Venus", mars: "Mars",
  jupiter: "Jupiter", saturn: "Saturn", uranus: "Uranus", neptune: "Neptune",
  pluto: "Pluto", northNode: "North Node", chiron: "Chiron", ascendant: "Ascendant", midheaven: "MC",
};

/** Reconstruct natal longitudes from a Western NativeResult (signIndex*30 + degree). */
function natalLongitudes(natal: NativeResult): { id: string; longitude: number }[] {
  const out: { id: string; longitude: number }[] = [];
  for (const key of Object.keys(NATAL_LABEL)) {
    const f = natal.factors[key];
    if (!f) continue;
    const v = f.value as { signIndex: number; degree: number };
    if (typeof v?.signIndex !== "number") continue;
    out.push({ id: NATAL_LABEL[key], longitude: v.signIndex * 30 + v.degree });
  }
  return out;
}

export function computeTransits(natal: NativeResult, atIso?: string): TransitsResult {
  const eph = getEphemeris();
  const instant = atIso ? Date.parse(atIso) : Date.now();
  const now = eph.positionsAt(instant);
  const natals = natalLongitudes(natal);

  const hits: TransitHit[] = [];
  const dt = 0.05;
  for (const t of TRANSIT_BODIES) {
    const tLon = now[t.body].longitude;
    const tSpeed = now[t.body].speed;
    for (const n of natals) {
      const sep = angularSeparation(tLon, n.longitude);
      const lum = t.id === "Sun" || t.id === "Moon" || n.id === "Sun" || n.id === "Moon" ? 1 : 0;
      let best: { type: string; angle: number; orb: number } | null = null;
      for (const a of ASPECTS) {
        const orb = Math.abs(sep - a.angle);
        if (orb <= a.orb + lum && (!best || orb < best.orb)) best = { type: a.type, angle: a.angle, orb };
      }
      if (!best) continue;
      // Natal point is fixed; only the transiting body moves. Applying = orb tightening.
      const orbNext = Math.abs(angularSeparation(tLon + tSpeed * dt, n.longitude) - best.angle);
      hits.push({
        transiting: t.label,
        natal: n.id,
        aspect: best.type,
        orb: Number(best.orb.toFixed(2)),
        applying: orbNext < best.orb,
      });
    }
  }
  hits.sort((a, b) => a.orb - b.orb);

  const angle = norm360(now.moon.longitude - now.sun.longitude);
  return {
    date: new Date(instant).toISOString(),
    season: {
      sunSign: toSignPosition(now.sun.longitude).sign.name,
      moonSign: toSignPosition(now.moon.longitude).sign.name,
      moonPhase: PHASES[Math.floor(((angle + 22.5) % 360) / 45)],
    },
    hits: hits.slice(0, 12),
  };
}
