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

/** Classical-ruler name → core body, for resolving the chart ruler's placement. */
const BODY_FROM_NAME: Record<string, CoreBody> = {
  Sun: "sun",
  Moon: "moon",
  Mercury: "mercury",
  Venus: "venus",
  Mars: "mars",
  Jupiter: "jupiter",
  Saturn: "saturn",
};

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

/**
 * Triplicity (element) rulers, day / night / participating, in the traditional
 * (Dorothean) scheme. Each element trine has a planet that rules it by day, one
 * by night, and a participating ruler shared across the trine. Surfaced as a
 * dignity layer the reader can lean on for "who is in charge of your fire".
 */
const TRIPLICITY: Record<string, { day: string; night: string; partner: string }> = {
  fire: { day: "Sun", night: "Jupiter", partner: "Saturn" },
  earth: { day: "Venus", night: "Moon", partner: "Mars" },
  air: { day: "Saturn", night: "Mercury", partner: "Jupiter" },
  water: { day: "Venus", night: "Mars", partner: "Moon" },
};

/** Classical sign (domicile) rulers, 0 = Aries. Used for the chart ruler. */
const DOMICILE = [
  "Mars", "Venus", "Mercury", "Moon", "Sun", "Mercury",
  "Venus", "Mars", "Jupiter", "Saturn", "Saturn", "Jupiter",
];

/** Decan (face) rulers in Chaldean order, Mars-first at Aries I. Cycles 0..35. */
const DECAN_FACE = ["Mars", "Sun", "Venus", "Mercury", "Moon", "Saturn", "Jupiter"];

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

    // Element / modality / polarity balance over the ten planets.
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

    // Dominant element/modality + overall polarity lean (pure: derived from the
    // distribution above). `polarity` is "balanced" only on an exact tie.
    const domElement = dominantKey(balance.elements);
    const domModality = dominantKey(balance.modalities);
    const activeCount = balance.polarity.active;
    const receptiveCount = balance.polarity.receptive;
    const polarityLean =
      activeCount > receptiveCount ? "active" : receptiveCount > activeCount ? "receptive" : "balanced";
    factors.dominant = {
      key: "dominant",
      label: "Dominant Signature",
      value: {
        element: domElement,
        modality: domModality,
        polarity: polarityLean,
        polarityCounts: { active: activeCount, receptive: receptiveCount },
      },
      display: `${cap(domElement)} · ${cap(domModality)} · ${cap(polarityLean)}`,
    };

    // Sun's triplicity (element) ruler set: a dignity layer over the Sun's
    // element. The active day/night ruler depends on sect, which needs houses;
    // date-only still reports the trine's rulers without picking the active one.
    const sunSign = SIGNS[Math.floor(norm360(positions.sun.longitude) / 30) % 12];
    const sunTrip = TRIPLICITY[sunSign.element];
    // Day chart when the Sun sits above the horizon (houses 7..12). Only known
    // with houses; default to undefined so the factor stays honest at low precision.
    const sunHouse = houses ? houseOf(positions.sun.longitude, houses.cusps) : undefined;
    const isDay = sunHouse !== undefined ? sunHouse >= 7 && sunHouse <= 12 : undefined;
    if (isDay !== undefined) {
      factors.sect = {
        key: "sect",
        label: "Sect",
        value: { sect: isDay ? "day" : "night", luminary: isDay ? "Sun" : "Moon" },
        display: isDay ? "Day chart (Sun by day)" : "Night chart (Moon by night)",
      };
    }
    factors["triplicity"] = {
      key: "triplicity",
      label: "Sun Triplicity Ruler",
      value: {
        element: sunSign.element,
        day: sunTrip.day,
        night: sunTrip.night,
        partner: sunTrip.partner,
        active: isDay === undefined ? null : isDay ? sunTrip.day : sunTrip.night,
      },
      display:
        isDay === undefined
          ? `${cap(sunSign.element)}: ${sunTrip.day} / ${sunTrip.night}`
          : `${isDay ? sunTrip.day : sunTrip.night} (${cap(sunSign.element)} ${isDay ? "by day" : "by night"})`,
    };

    // Sun's decan (each 10° third of a sign) and its Chaldean face ruler. A
    // finer reading of the solar placement, available at date precision.
    const sunLonNorm = norm360(positions.sun.longitude);
    const sunDecanIndex = Math.floor(sunLonNorm / 10) % 36;
    const sunDecanInSign = Math.floor((sunLonNorm % 30) / 10) + 1;
    const sunDecanRuler = DECAN_FACE[sunDecanIndex % 7];
    factors.decan = {
      key: "decan",
      label: "Sun Decan",
      value: { sign: sunSign.name, signIndex: sunSign.index, decanInSign: sunDecanInSign, decanIndex: sunDecanIndex, ruler: sunDecanRuler },
      display: `${sunSign.name} decan ${sunDecanInSign} · ${sunDecanRuler}`,
    };

    // Chart ruler: the classical domicile lord of the rising sign. Only with an
    // Ascendant. Records the ruler's own placement so the adapter can weight it.
    if (houses) {
      const ascIdx = toSignPosition(houses.ascendant).sign.index;
      const rulerName = DOMICILE[ascIdx];
      const rulerBody = BODY_FROM_NAME[rulerName];
      const rulerPos = rulerBody ? positions[rulerBody] : undefined;
      const rulerSp = rulerPos ? toSignPosition(rulerPos.longitude) : undefined;
      factors["chart-ruler"] = {
        key: "chart-ruler",
        label: "Chart Ruler",
        value: {
          ruler: rulerName,
          ascSign: SIGNS[ascIdx].name,
          signIndex: rulerSp?.sign.index ?? null,
          house: rulerPos ? houseOf(rulerPos.longitude, houses.cusps) : null,
        },
        display: `${rulerName}${rulerSp ? ` in ${rulerSp.sign.name}` : ""} (ruler of ${SIGNS[ascIdx].name} Asc)`,
      };

      // Quadrant emphasis: hemispheres + angular/succedent/cadent houses, a
      // shape read of where the chart's weight sits. Counts the ten planets.
      const quad = quadrants(positions, houses.cusps);
      factors["chart-shape"] = {
        key: "chart-shape",
        label: "Chart Emphasis",
        value: quad,
        display: `${cap(quad.hemisphereVertical)} · ${cap(quad.hemisphereHorizontal)} · ${cap(quad.dominantQuadruplicity)}`,
      };
    }

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
  const polarity: Record<string, number> = { active: 0, receptive: 0 };
  const planets: CoreBody[] = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"];
  for (const p of planets) {
    const sign = SIGNS[Math.floor(norm360(positions[p].longitude) / 30) % 12];
    elements[sign.element] += 1;
    modalities[sign.modality] += 1;
    polarity[sign.polarity] += 1;
  }
  return { elements, modalities, polarity };
}

/**
 * Quadrant / hemisphere emphasis over the ten planets. Vertical hemisphere is
 * houses 1..6 (below the horizon) vs 7..12 (above). Horizontal hemisphere is
 * houses 4..9 (eastern, self-driven) vs 10..3 (western, other-driven). The
 * quadruplicity tally groups houses into angular (1,4,7,10), succedent
 * (2,5,8,11), and cadent (3,6,9,12): drive vs consolidation vs adaptation.
 */
function quadrants(positions: PlanetaryLongitudes, cusps: number[]) {
  const planets: CoreBody[] = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"];
  let below = 0;
  let above = 0;
  let east = 0;
  let west = 0;
  const quadruplicity: Record<string, number> = { angular: 0, succedent: 0, cadent: 0 };
  const ANGULAR = new Set([1, 4, 7, 10]);
  const SUCCEDENT = new Set([2, 5, 8, 11]);
  for (const p of planets) {
    const h = houseOf(positions[p].longitude, cusps);
    if (h <= 6) below += 1;
    else above += 1;
    if (h >= 4 && h <= 9) east += 1;
    else west += 1;
    if (ANGULAR.has(h)) quadruplicity.angular += 1;
    else if (SUCCEDENT.has(h)) quadruplicity.succedent += 1;
    else quadruplicity.cadent += 1;
  }
  return {
    hemisphereVertical: above >= below ? "above" : "below",
    hemisphereHorizontal: east >= west ? "eastern" : "western",
    dominantQuadruplicity: dominantKey(quadruplicity),
    quadruplicity,
  };
}

/** Key with the highest count; ties resolve to the first key by insertion order. */
function dominantKey(counts: Record<string, number>): string {
  let bestKey = "";
  let bestVal = -Infinity;
  for (const [k, v] of Object.entries(counts)) {
    if (v > bestVal) {
      bestVal = v;
      bestKey = k;
    }
  }
  return bestKey;
}

function lunarPhase(sunLon: number, moonLon: number): string {
  const angle = norm360(moonLon - sunLon);
  return PHASES[Math.floor(((angle + 22.5) % 360) / 45)];
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
