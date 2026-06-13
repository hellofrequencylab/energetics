import type { BirthEvent } from "@/lib/core/birth-event";
import type { CoreBody, EngineDeps, NativeFactor, NativeResult, SystemEngine, SystemMeta } from "@/lib/core/contracts";
import { toUtcInstant } from "@/lib/core/time";
import { norm360, toSignPosition } from "@/lib/core/zodiac";

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

function nakshatra(sidLon: number): { name: string; pada: number } {
  const lon = norm360(sidLon);
  const index = Math.floor(lon / NAK_ARC);
  return { name: NAKSHATRAS[index], pada: Math.floor((lon % NAK_ARC) / (NAK_ARC / 4)) + 1 };
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
  nakshatra: string;
  pada: number;
  house: number; // whole-sign bhava from the Lagna
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
      const sign = toSignPosition(pos.longitude).sign;
      const nak = nakshatra(pos.longitude);
      const placement: VedicPlacement = {
        rasi: RASI[sign.index],
        signIndex: sign.index,
        longitude: pos.longitude,
        nakshatra: nak.name,
        pada: nak.pada,
        house: houseOf(sign.index),
        retrograde: pos.retrograde,
      };
      factors[graha.id] = {
        key: graha.id,
        label: graha.label,
        value: placement,
        display: `${RASI[sign.index]} · ${nak.name} (${placement.house}H)${pos.retrograde ? " ℞" : ""}`,
      };
    }

    const moonNak = (factors.moon.value as VedicPlacement).nakshatra;
    return {
      systemId: meta.id,
      factors: {
        ...factors,
        janma: { key: "janma", label: "Janma Nakshatra", value: moonNak, display: moonNak },
      },
    };
  },
};
