import type { BirthEvent } from "@/lib/core/birth-event";
import type { EngineDeps, NativeResult, SystemEngine, SystemMeta } from "@/lib/core/contracts";
import { toSignPosition } from "@/lib/core/zodiac";

export const meta: SystemMeta = {
  id: "egyptian-decans",
  displayName: "Egyptian Decans",
  lineage: "traditional",
  requires: { time: false, place: false },
  derivedFrom: "ephemeris",
  dependsOn: [],
  corpusVersion: "1",
};

// Decanic ("faces") rulers in Chaldean order, starting with Mars at Aries I
// (Picatrix/Agrippa). Cycles across all 36 decans.
const CHALDEAN = ["Mars", "Sun", "Venus", "Mercury", "Moon", "Saturn", "Jupiter"];

export interface DecanResult {
  sign: string;
  signIndex: number;
  decanInSign: number; // 1..3
  decanIndex: number; // 0..35
  ruler: string;
}

/**
 * The Sun's decan: each 10° third of a sign, with its Chaldean face ruler.
 * Pure function of the Sun's ecliptic longitude (date precision suffices).
 */
export const engine: SystemEngine = {
  meta,
  compute(birth: BirthEvent, { ephemeris }: EngineDeps): NativeResult {
    const [year, month, day] = birth.date.split("-").map(Number);
    const instant = birth.time && birth.place
      ? Date.UTC(year, month - 1, day, ...timeParts(birth.time))
      : Date.UTC(year, month - 1, day, 12, 0);

    const sunLon = ephemeris.positionsAt(instant).sun.longitude;
    const sp = toSignPosition(sunLon);
    const decanIndex = Math.floor(sunLon / 10) % 36;
    const decanInSign = Math.floor(sp.degreesInSign / 10) + 1;
    const ruler = CHALDEAN[decanIndex % 7];

    const result: DecanResult = {
      sign: sp.sign.name,
      signIndex: sp.sign.index,
      decanInSign,
      decanIndex,
      ruler,
    };

    return {
      systemId: meta.id,
      factors: {
        decan: {
          key: "decan",
          label: "Sun Decan",
          value: result,
          display: `${sp.sign.name} decan ${decanInSign} · ${ruler}`,
        },
      },
    };
  },
};

function timeParts(time: string): [number, number] {
  const [h, m] = time.split(":").map(Number);
  return [h, m];
}
