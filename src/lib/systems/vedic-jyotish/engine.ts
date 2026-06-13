import type { BirthEvent } from "@/lib/core/birth-event";
import type { EngineDeps, NativeResult, SystemEngine, SystemMeta } from "@/lib/core/contracts";
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

function nakshatra(sidLon: number): { name: string; pada: number; index: number } {
  const lon = norm360(sidLon);
  const index = Math.floor(lon / NAK_ARC);
  const pada = Math.floor((lon % NAK_ARC) / (NAK_ARC / 4)) + 1;
  return { name: NAKSHATRAS[index], pada, index };
}

interface RasiPlacement {
  rasi: string;
  signIndex: number;
  longitude: number;
}

/** Phase 1 minimal output: Lagna + Moon (rasi & nakshatra). */
export const engine: SystemEngine = {
  meta,
  compute(birth: BirthEvent, { ephemeris }: EngineDeps): NativeResult {
    const instant = toUtcInstant(birth);
    const sidereal = ephemeris.positionsAt(instant, { sidereal: true });
    const ayan = ephemeris.ayanamsaAt(instant);
    const houses = ephemeris.housesAt(instant, birth.place!.lat, birth.place!.lng);

    const lagnaLon = norm360(houses.ascendant - ayan);
    const lagnaSign = toSignPosition(lagnaLon).sign;
    const moonLon = sidereal.moon.longitude;
    const moonSign = toSignPosition(moonLon).sign;
    const nak = nakshatra(moonLon);

    const lagna: RasiPlacement = { rasi: RASI[lagnaSign.index], signIndex: lagnaSign.index, longitude: lagnaLon };
    const moon: RasiPlacement & { nakshatra: string; pada: number } = {
      rasi: RASI[moonSign.index],
      signIndex: moonSign.index,
      longitude: moonLon,
      nakshatra: nak.name,
      pada: nak.pada,
    };

    return {
      systemId: meta.id,
      factors: {
        lagna: { key: "lagna", label: "Lagna (Asc)", value: lagna, display: RASI[lagnaSign.index] },
        moon: {
          key: "moon",
          label: "Moon",
          value: moon,
          display: `${RASI[moonSign.index]} · ${nak.name} (pada ${nak.pada})`,
        },
      },
    };
  },
};
