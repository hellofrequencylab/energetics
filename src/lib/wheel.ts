/**
 * Normalize a computed chart into chart-wheel geometry. Pure (no React), so it
 * can feed the shared SVG wheel from any ephemeris system. Reconstructs absolute
 * ecliptic longitudes from the per-body placements (signIndex * 30 + degree).
 */
import type { NativeResult } from "@/lib/core/contracts";

export interface WheelPlanet {
  body: string;
  glyph: string;
  longitude: number;
  retrograde: boolean;
}

export interface WheelAspect {
  a: string;
  b: string;
  nature: "harmonious" | "challenging" | "neutral";
}

export interface WheelData {
  planets: WheelPlanet[];
  ascendant: number | null;
  midheaven: number | null;
  cusps: number[] | null;
  aspects: WheelAspect[];
}

const BODY_GLYPH: Record<string, string> = {
  sun: "☉", moon: "☽", mercury: "☿", venus: "♀", mars: "♂", jupiter: "♃",
  saturn: "♄", uranus: "♅", neptune: "♆", pluto: "♇", northNode: "☊", chiron: "⚷",
};

const ASPECT_NATURE: Record<string, WheelAspect["nature"]> = {
  trine: "harmonious",
  sextile: "harmonious",
  square: "challenging",
  opposition: "challenging",
  conjunction: "neutral",
};

interface Placement {
  signIndex: number;
  degree: number;
  retrograde?: boolean;
}

/** Build wheel geometry from a western-tropical NativeResult. */
export function westernToWheel(native: NativeResult): WheelData | null {
  const planets: WheelPlanet[] = [];
  for (const body of Object.keys(BODY_GLYPH)) {
    const factor = native.factors[body];
    if (!factor) continue;
    const p = factor.value as Placement;
    planets.push({
      body,
      glyph: BODY_GLYPH[body],
      longitude: p.signIndex * 30 + p.degree,
      retrograde: !!p.retrograde,
    });
  }
  if (planets.length === 0) return null;

  const angle = (key: string): number | null => {
    const f = native.factors[key];
    if (!f) return null;
    const v = f.value as Placement;
    return v.signIndex * 30 + v.degree;
  };

  const housesFactor = native.factors.houses;
  const cusps = housesFactor ? (housesFactor.value as { cusps: number[] }).cusps : null;

  const aspectsFactor = native.factors.aspects;
  const aspects: WheelAspect[] = aspectsFactor
    ? (aspectsFactor.value as { a: string; b: string; type: string }[]).map((a) => ({
        a: a.a,
        b: a.b,
        nature: ASPECT_NATURE[a.type] ?? "neutral",
      }))
    : [];

  return { planets, ascendant: angle("ascendant"), midheaven: angle("midheaven"), cusps, aspects };
}

const GRAHA_GLYPH: Record<string, string> = {
  sun: "☉", moon: "☽", mercury: "☿", venus: "♀", mars: "♂",
  jupiter: "♃", saturn: "♄", rahu: "☊", ketu: "☋",
};

/** Build wheel geometry from a vedic-jyotish NativeResult (sidereal, whole-sign). */
export function vedicToWheel(native: NativeResult): WheelData | null {
  const planets: WheelPlanet[] = [];
  for (const id of Object.keys(GRAHA_GLYPH)) {
    const factor = native.factors[id];
    if (!factor) continue;
    const v = factor.value as { longitude: number; retrograde?: boolean };
    planets.push({ body: id, glyph: GRAHA_GLYPH[id], longitude: v.longitude, retrograde: !!v.retrograde });
  }
  if (planets.length === 0) return null;

  const lagna = native.factors.lagna?.value as { longitude: number; signIndex: number } | undefined;
  // Whole-sign houses: cusps sit at the 0° boundary of each sign from the Lagna.
  const cusps = lagna ? Array.from({ length: 12 }, (_, i) => ((lagna.signIndex + i) % 12) * 30) : null;

  // Graha drishti differs from Western angular aspects — omit aspect lines here.
  return { planets, ascendant: lagna?.longitude ?? null, midheaven: null, cusps, aspects: [] };
}
