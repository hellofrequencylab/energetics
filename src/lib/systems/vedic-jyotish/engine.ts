import type { BirthEvent } from "@/lib/core/birth-event";
import type { CoreBody, EngineDeps, NativeFactor, NativeResult, SystemEngine, SystemMeta } from "@/lib/core/contracts";
import { toUtcInstant } from "@/lib/core/time";
import { norm360, SIGNS, toSignPosition } from "@/lib/core/zodiac";

export const meta: SystemMeta = {
  id: "vedic-jyotish",
  displayName: "Vedic Jyotish (Sidereal · Lahiri)",
  lineage: "traditional",
  requires: { time: true, place: true },
  derivedFrom: "ephemeris",
  dependsOn: [],
  corpusVersion: "1",
};

export const RASI = [
  "Mesha", "Vrishabha", "Mithuna", "Karka", "Simha", "Kanya",
  "Tula", "Vrishchika", "Dhanu", "Makara", "Kumbha", "Meena",
];

export const NAKSHATRAS = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
  "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
  "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
  "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha",
  "Purva Bhadrapada", "Uttara Bhadrapada", "Revati",
];

const NAK_ARC = 360 / 27;

/**
 * Vimshottari dasha lords in their fixed 27-nakshatra cycle (Ketu first at
 * Ashwini), with the length of each lord's mahadasha in years. The cycle repeats
 * three times across the 27 nakshatras. This drives the birth dasha lord.
 */
const DASHA_LORDS = [
  "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury",
];
const DASHA_YEARS: Record<string, number> = {
  Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7, Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17,
};

function nakshatra(sidLon: number): { name: string; index: number; pada: number; lord: string } {
  const lon = norm360(sidLon);
  const index = Math.floor(lon / NAK_ARC);
  return {
    name: NAKSHATRAS[index],
    index,
    pada: Math.floor((lon % NAK_ARC) / (NAK_ARC / 4)) + 1,
    lord: DASHA_LORDS[index % 9],
  };
}

/**
 * Navamsa (D9) sign of a longitude: each rasi divides into 9 parts of 3°20',
 * and the divisional signs follow the classical movable/fixed/dual start rule.
 * The D9 is the most weighted divisional chart in Jyotish, read for inner
 * strength and partnership. Returns the 0..11 sign index of the navamsa.
 */
function navamsaSignIndex(sidLon: number): number {
  const lon = norm360(sidLon);
  const signIndex = Math.floor(lon / 30);
  const within = lon - signIndex * 30;
  const part = Math.floor(within / (30 / 9)); // 0..8
  // Start sign of the navamsa series depends on the rasi's element-by-modality:
  // fire signs start from themselves, earth from Capricorn, air from Libra,
  // water from Cancer (the classical movable-sign anchors of each trine).
  const START = [0, 9, 6, 3]; // Aries, Capricorn, Libra, Cancer
  const start = START[signIndex % 4];
  return (start + part) % 12;
}

/** The 9 grahas: 7 classical + Rahu (North Node) / Ketu (South Node). */
const GRAHAS: { id: string; label: string; body: CoreBody }[] = [
  { id: "sun", label: "Sun (Surya)", body: "sun" },
  { id: "moon", label: "Moon (Chandra)", body: "moon" },
  { id: "mercury", label: "Mercury (Budha)", body: "mercury" },
  { id: "venus", label: "Venus (Shukra)", body: "venus" },
  { id: "mars", label: "Mars (Mangala)", body: "mars" },
  { id: "jupiter", label: "Jupiter (Guru)", body: "jupiter" },
  { id: "saturn", label: "Saturn (Shani)", body: "saturn" },
  { id: "rahu", label: "Rahu (N. Node)", body: "northNode" },
  { id: "ketu", label: "Ketu (S. Node)", body: "southNode" },
];

export interface VedicPlacement {
  rasi: string;
  signIndex: number;
  longitude: number; // sidereal
  degree: number; // 0..30 within sign
  nakshatra: string;
  nakshatraLord: string; // Vimshottari lord of the occupied nakshatra
  pada: number;
  house: number; // whole-sign bhava from the Lagna
  navamsaSign: string; // D9 sign
  navamsaSignIndex: number;
  retrograde: boolean;
}

export const engine: SystemEngine = {
  meta,
  compute(birth: BirthEvent, { ephemeris }: EngineDeps): NativeResult {
    const instant = toUtcInstant(birth);
    const sidereal = ephemeris.positionsAt(instant, { sidereal: true });
    const ayan = ephemeris.ayanamsaAt(instant);
    const houses = ephemeris.housesAt(instant, birth.place!.lat, birth.place!.lng);

    const lagnaLon = norm360(houses.ascendant - ayan);
    const lagnaSign = toSignPosition(lagnaLon).sign;
    const houseOf = (signIndex: number) => ((signIndex - lagnaSign.index + 12) % 12) + 1;

    const factors: Record<string, NativeFactor> = {
      lagna: {
        key: "lagna",
        label: "Lagna (Asc)",
        value: { rasi: RASI[lagnaSign.index], signIndex: lagnaSign.index, longitude: lagnaLon },
        display: RASI[lagnaSign.index],
      },
    };

    for (const graha of GRAHAS) {
      const pos = sidereal[graha.body];
      const sp = toSignPosition(pos.longitude);
      const sign = sp.sign;
      const nak = nakshatra(pos.longitude);
      const d9 = navamsaSignIndex(pos.longitude);
      const placement: VedicPlacement = {
        rasi: RASI[sign.index],
        signIndex: sign.index,
        longitude: pos.longitude,
        degree: Number(sp.degreesInSign.toFixed(2)),
        nakshatra: nak.name,
        nakshatraLord: nak.lord,
        pada: nak.pada,
        house: houseOf(sign.index),
        navamsaSign: RASI[d9],
        navamsaSignIndex: d9,
        retrograde: pos.retrograde,
      };
      factors[graha.id] = {
        key: graha.id,
        label: graha.label,
        value: placement,
        display: `${RASI[sign.index]} · ${nak.name} (${placement.house}H)${pos.retrograde ? " ℞" : ""}`,
      };
    }

    const moon = factors.moon.value as VedicPlacement;
    const moonNak = moon.nakshatra;

    // Janma (birth) Moon factors. The Moon-sign (Janma Rasi) is the chart a
    // Jyotishi reads first, and the Moon's nakshatra fixes the starting
    // mahadasha of the Vimshottari dasha sequence (the lord and its length).
    factors.janma = { key: "janma", label: "Janma Nakshatra", value: moonNak, display: moonNak };
    factors["janma-rasi"] = {
      key: "janma-rasi",
      label: "Janma Rasi (Moon sign)",
      value: { rasi: moon.rasi, signIndex: moon.signIndex },
      display: moon.rasi,
    };
    factors["dasha-lord"] = {
      key: "dasha-lord",
      label: "Birth Dasha Lord",
      value: { lord: moon.nakshatraLord, years: DASHA_YEARS[moon.nakshatraLord] ?? null, fromNakshatra: moonNak },
      display: `${moon.nakshatraLord} mahadasha`,
    };

    // Atmakaraka: the graha at the highest degree within its sign (Jaimini's
    // "soul significator"). The seven non-nodal grahas are eligible by the
    // common convention. Deterministic, ties break by graha order.
    const akCandidates: { id: string; degree: number; rasi: string }[] = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn"]
      .map((id) => {
        const p = factors[id].value as VedicPlacement;
        return { id, degree: p.degree, rasi: p.rasi };
      });
    let atmakaraka = akCandidates[0];
    for (const c of akCandidates) if (c.degree > atmakaraka.degree) atmakaraka = c;
    factors.atmakaraka = {
      key: "atmakaraka",
      label: "Atmakaraka",
      value: { graha: atmakaraka.id, degree: atmakaraka.degree, rasi: atmakaraka.rasi },
      display: `${cap(atmakaraka.id)} (${atmakaraka.degree.toFixed(2)}° ${atmakaraka.rasi})`,
    };

    // Tatva (element) emphasis across the nine grahas, by their occupied rasi's
    // element. A chart-wide elemental temperament, like the Western balance.
    const tatva = tatvaCounts(GRAHAS.map((g) => (factors[g.id].value as VedicPlacement).signIndex));
    factors.tatva = {
      key: "tatva",
      label: "Tatva Balance",
      value: { counts: tatva.counts, dominant: tatva.dominant },
      display: tatva.dominant ? cap(tatva.dominant) : "",
    };

    return { systemId: meta.id, factors };
  },
};

/** Element tally across grahas by occupied rasi, with the dominant element. */
function tatvaCounts(signIndices: number[]) {
  const counts: Record<string, number> = { fire: 0, earth: 0, air: 0, water: 0 };
  for (const idx of signIndices) {
    const sign = SIGNS[idx];
    if (sign) counts[sign.element] += 1;
  }
  let dominant = "";
  let best = -1;
  for (const el of ["fire", "earth", "air", "water"]) {
    if (counts[el] > best) {
      best = counts[el];
      dominant = el;
    }
  }
  return { counts, dominant };
}

function cap(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}
