import type { BirthEvent } from "@/lib/core/birth-event";
import type {
  Body,
  CoreBody,
  EngineDeps,
  NativeFactor,
  NativeResult,
  PlanetaryLongitudes,
  SystemEngine,
  SystemMeta,
} from "@/lib/core/contracts";
import { toUtcInstant } from "@/lib/core/time";
import { norm360, SIGNS, toSignPosition } from "@/lib/core/zodiac";
import { computeAspects, type AspectBody } from "./aspects";

export const meta: SystemMeta = {
  id: "western-tropical",
  displayName: "Western (Tropical) Astrology",
  lineage: "traditional",
  // Runs date-only; emits more as precision rises (spec §0).
  requires: { time: false, place: false },
  derivedFrom: "ephemeris",
  dependsOn: [],
  corpusVersion: "1",
};

// §8: Whole Sign default (no polar breakdown); Placidus would be a config.
const HOUSE_SYSTEM: string = "W";

/** The 12 bodies (spec §1). Chiron is optional (needs ephemeris data files). */
const BODIES: { body: Body; label: string; glyph: string }[] = [
  { body: "sun", label: "Sun", glyph: "☉" },
  { body: "moon", label: "Moon", glyph: "☽" },
  { body: "mercury", label: "Mercury", glyph: "☿" },
  { body: "venus", label: "Venus", glyph: "♀" },
  { body: "mars", label: "Mars", glyph: "♂" },
  { body: "jupiter", label: "Jupiter", glyph: "♃" },
  { body: "saturn", label: "Saturn", glyph: "♄" },
  { body: "uranus", label: "Uranus", glyph: "♅" },
  { body: "neptune", label: "Neptune", glyph: "♆" },
  { body: "pluto", label: "Pluto", glyph: "♇" },
  { body: "northNode", label: "North Node", glyph: "☊" },
  { body: "chiron", label: "Chiron", glyph: "⚷" },
];

export interface WesternPlacement {
  sign: string;
  signIndex: number;
  degree: number; // 0-30 within sign
  retrograde: boolean;
  house?: number;
  cuspWarning?: string; // date-only Moon that crosses a sign that day
}

const PHASES = [
  "New Moon", "Waxing Crescent", "First Quarter", "Waxing Gibbous",
  "Full Moon", "Waning Gibbous", "Last Quarter", "Waning Crescent",
];

export const engine: SystemEngine = {
  meta,
  compute(birth: BirthEvent, { ephemeris }: EngineDeps): NativeResult {
    const [year, month, day] = birth.date.split("-").map(Number);
    const hasTime = !!birth.time;
    const hasPlace = !!birth.place;

    // Resolve the instant by available precision (spec §0 tiering).
    const instant = hasTime
      ? hasPlace
        ? toUtcInstant(birth)
        : utcAssumed(birth) // time but no place → interpret as UTC
      : Date.UTC(year, month - 1, day, 12, 0); // date-only → noon UTC for signs

    const positions = ephemeris.positionsAt(instant);

    // Houses + angles only at date-time-place.
    const houses =
      hasTime && hasPlace
        ? ephemeris.housesAt(instant, birth.place!.lat, birth.place!.lng, houseSystemFor(birth.place!.lat))
        : null;

    const factors: Record<string, NativeFactor> = {};

    // Angles first (only with time+place).
    if (houses) {
      factors.ascendant = angleFactor("ascendant", "Ascendant", houses.ascendant);
      factors.midheaven = angleFactor("midheaven", "Midheaven", houses.midheaven);
    }

    // Bodies.
    const moonCusp = !hasTime ? moonCuspWarning(ephemeris, year, month, day) : undefined;
    for (const { body, label } of BODIES) {
      const pos = positions[body];
      if (!pos) continue; // Chiron may be absent under the Moshier fallback.
      const sp = toSignPosition(pos.longitude);
      const placement: WesternPlacement = {
        sign: sp.sign.name,
        signIndex: sp.sign.index,
        degree: Number(sp.degreesInSign.toFixed(2)),
        retrograde: pos.retrograde,
        house: houses ? houseOf(pos.longitude, houses.cusps) : undefined,
        cuspWarning: body === "moon" ? moonCusp : undefined,
      };
      factors[body] = {
        key: body,
        label,
        value: placement,
        display:
          (hasTime ? sp.formatted : sp.sign.name) +
          (pos.retrograde ? " ℞" : "") +
          (placement.cuspWarning ? ` (cusp → ${placement.cuspWarning})` : "") +
          (placement.house ? ` · House ${placement.house}` : ""),
      };
    }

    // Element / modality balance over the ten planets.
    const balance = distribution(positions);
    factors.elements = {
      key: "elements",
      label: "Element Balance",
      value: balance.elements,
      display: Object.entries(balance.elements)
        .map(([k, v]) => `${cap(k)} ${v}`)
        .join(" · "),
    };
    factors.modalities = {
      key: "modalities",
      label: "Modality Balance",
      value: balance.modalities,
      display: Object.entries(balance.modalities)
        .map(([k, v]) => `${cap(k)} ${v}`)
        .join(" · "),
    };

    // Aspects + lunar phase require precise time.
    if (hasTime) {
      const aspectBodies: AspectBody[] = BODIES.filter((b) => positions[b.body]).map((b) => ({
        body: b.body,
        longitude: positions[b.body]!.longitude,
        speed: positions[b.body]!.speed,
      }));
      const aspects = computeAspects(aspectBodies);
      factors.aspects = {
        key: "aspects",
        label: "Aspects",
        value: aspects,
        display: `${aspects.length} major aspects`,
      };
      const phase = lunarPhase(positions.sun.longitude, positions.moon.longitude);
      factors["lunar-phase"] = { key: "lunar-phase", label: "Lunar Phase", value: phase, display: phase };
    }

    if (houses) {
      factors.houses = {
        key: "houses",
        label: "Houses",
        value: { system: houses.system, cusps: houses.cusps },
        display: houses.system === "W" ? "Whole Sign" : houses.system,
      };
    }

    return { systemId: meta.id, factors };
  },
};

// --- helpers ---------------------------------------------------------------

function utcAssumed(birth: BirthEvent): number {
  const [year, month, day] = birth.date.split("-").map(Number);
  const [hour, minute] = birth.time!.split(":").map(Number);
  return Date.UTC(year, month - 1, day, hour, minute);
}

function houseSystemFor(lat: number): string {
  // §2: Placidus is undefined above the polar circles — fall back to Whole Sign.
  if (HOUSE_SYSTEM === "P" && Math.abs(lat) > 66) return "W";
  return HOUSE_SYSTEM;
}

function angleFactor(key: string, label: string, longitude: number): NativeFactor {
  const sp = toSignPosition(longitude);
  return {
    key,
    label,
    value: { sign: sp.sign.name, signIndex: sp.sign.index, degree: Number(sp.degreesInSign.toFixed(2)) },
    display: sp.formatted,
  };
}

/** Which house (1-12) a longitude falls in, given the 12 cusp longitudes. */
function houseOf(longitude: number, cusps: number[]): number {
  const lon = norm360(longitude);
  for (let i = 0; i < 12; i++) {
    const start = cusps[i];
    const end = cusps[(i + 1) % 12];
    const span = norm360(end - start);
    if (norm360(lon - start) < span) return i + 1;
  }
  return 12;
}

function moonCuspWarning(
  ephemeris: EngineDeps["ephemeris"],
  year: number,
  month: number,
  day: number,
): string | undefined {
  const start = toSignPosition(ephemeris.positionsAt(Date.UTC(year, month - 1, day, 0, 0)).moon.longitude).sign;
  const end = toSignPosition(ephemeris.positionsAt(Date.UTC(year, month - 1, day, 23, 59)).moon.longitude).sign;
  return start.name !== end.name ? `${start.name}→${end.name}` : undefined;
}

function distribution(positions: PlanetaryLongitudes) {
  const elements: Record<string, number> = { fire: 0, earth: 0, air: 0, water: 0 };
  const modalities: Record<string, number> = { cardinal: 0, fixed: 0, mutable: 0 };
  const planets: CoreBody[] = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"];
  for (const p of planets) {
    const sign = SIGNS[Math.floor(norm360(positions[p].longitude) / 30) % 12];
    elements[sign.element] += 1;
    modalities[sign.modality] += 1;
  }
  return { elements, modalities };
}

function lunarPhase(sunLon: number, moonLon: number): string {
  const angle = norm360(moonLon - sunLon);
  return PHASES[Math.floor(((angle + 22.5) % 360) / 45)];
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
