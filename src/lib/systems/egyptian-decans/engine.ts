import type { BirthEvent } from "@/lib/core/birth-event";
import type { EngineDeps, NativeFactor, NativeResult, SystemEngine, SystemMeta } from "@/lib/core/contracts";
import { norm360, SIGNS, toSignPosition } from "@/lib/core/zodiac";

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

/**
 * Each sign's three decans, in Hellenistic/Indian convention, also carry a
 * secondary "triplicity face" ruler: the decan belongs to the sign itself, then
 * to the next two signs of the same element (the trine). This gives each decan a
 * sub-flavor drawn from a kindred sign of its own element. Returns the 0..11
 * sign index whose nature colors the decan.
 */
function decanTriplicityFace(signIndex: number, decanInSign: number): number {
  // step 0 = the sign itself, then +4 and +8 walk its elemental trine.
  return (signIndex + (decanInSign - 1) * 4) % 12;
}

export interface DecanResult {
  sign: string;
  signIndex: number;
  decanInSign: number; // 1..3
  decanIndex: number; // 0..35
  ruler: string;
  element: string; // element of the host sign
  faceSign: string; // kindred sign of the same element coloring this decan
  faceSignIndex: number;
}

/** Build a decan reading for any ecliptic longitude. */
function decanAt(longitude: number): DecanResult {
  const lon = norm360(longitude);
  const sp = toSignPosition(lon);
  const decanIndex = Math.floor(lon / 10) % 36;
  const decanInSign = Math.floor(sp.degreesInSign / 10) + 1;
  const ruler = CHALDEAN[decanIndex % 7];
  const faceIdx = decanTriplicityFace(sp.sign.index, decanInSign);
  return {
    sign: sp.sign.name,
    signIndex: sp.sign.index,
    decanInSign,
    decanIndex,
    ruler,
    element: sp.sign.element,
    faceSign: SIGNS[faceIdx].name,
    faceSignIndex: faceIdx,
  };
}

/**
 * The decans: each 10° third of a sign, with its Chaldean face ruler and a
 * secondary triplicity face. The Sun's decan is the headline (date precision
 * suffices); the Moon's decan and, with a birth time and place, the rising
 * decan add further reads.
 */
export const engine: SystemEngine = {
  meta,
  compute(birth: BirthEvent, { ephemeris }: EngineDeps): NativeResult {
    const [year, month, day] = birth.date.split("-").map(Number);
    const hasTimePlace = !!birth.time && !!birth.place;
    const instant = hasTimePlace
      ? Date.UTC(year, month - 1, day, ...timeParts(birth.time!))
      : Date.UTC(year, month - 1, day, 12, 0);

    const positions = ephemeris.positionsAt(instant);
    const sun = decanAt(positions.sun.longitude);
    const moon = decanAt(positions.moon.longitude);

    const factors: Record<string, NativeFactor> = {
      decan: {
        key: "decan",
        label: "Sun Decan",
        value: sun,
        display: `${sun.sign} decan ${sun.decanInSign} · ${sun.ruler}`,
      },
      "moon-decan": {
        key: "moon-decan",
        label: "Moon Decan",
        value: moon,
        display: `${moon.sign} decan ${moon.decanInSign} · ${moon.ruler}`,
      },
      "decan-ruler": {
        key: "decan-ruler",
        label: "Decan Ruler",
        value: sun.ruler,
        display: `${sun.ruler} (face of ${sun.sign} decan ${sun.decanInSign})`,
      },
      "decan-face": {
        key: "decan-face",
        label: "Decan Triplicity Face",
        value: { faceSign: sun.faceSign, faceSignIndex: sun.faceSignIndex, element: sun.element },
        display: `${sun.faceSign} face (${cap(sun.element)})`,
      },
    };

    // Rising decan: with an exact time and place, the decan on the eastern
    // horizon, the classical "hour-marker" decan. A finer, time-sensitive read.
    if (hasTimePlace) {
      const houses = ephemeris.housesAt(instant, birth.place!.lat, birth.place!.lng);
      const asc = decanAt(houses.ascendant);
      factors["rising-decan"] = {
        key: "rising-decan",
        label: "Rising Decan",
        value: asc,
        display: `${asc.sign} decan ${asc.decanInSign} · ${asc.ruler}`,
      };
    }

    return { systemId: meta.id, factors };
  },
};

function timeParts(time: string): [number, number] {
  const [h, m] = time.split(":").map(Number);
  return [h, m];
}

function cap(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}
