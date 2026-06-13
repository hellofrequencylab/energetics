import type { BirthEvent } from "@/lib/core/birth-event";
import type { NativeResult, SystemEngine, SystemMeta } from "@/lib/core/contracts";
import { dateParts, gregorianToJulianDay } from "@/lib/core/time";

export const meta: SystemMeta = {
  id: "tzolkin",
  displayName: "Mayan Tzolk'in",
  lineage: "traditional",
  requires: { time: false, place: false },
  derivedFrom: "date",
  dependsOn: [],
  corpusVersion: "1",
};

/** The 20 day-signs, in order. */
export const DAY_SIGNS = [
  "Imix", "Ik'", "Ak'b'al", "K'an", "Chikchan", "Kimi", "Manik'", "Lamat",
  "Muluk", "Ok", "Chuwen", "Eb'", "B'en", "Ix", "Men", "Kib'", "Kab'an",
  "Etz'nab'", "Kawak", "Ajaw",
] as const;

// §12: GMT (Goodman–Martínez–Thompson) correlation 584283 — JDN of 4 Ajaw 8 Kumk'u.
const GMT_CORRELATION = 584283;

/** Phase 1 minimal output: day-sign + galactic tone (1–13). */
export const engine: SystemEngine = {
  meta,
  compute(birth: BirthEvent): NativeResult {
    const { year, month, day } = dateParts(birth);
    const jdn = Math.floor(gregorianToJulianDay(year, month, day, 12) + 0.5);
    const days = jdn - GMT_CORRELATION;

    const signIndex = (((days + 19) % 20) + 20) % 20; // correlation day = Ajaw (19)
    const tone = ((((days + 3) % 13) + 13) % 13) + 1; // correlation day = tone 4
    const daySign = DAY_SIGNS[signIndex];

    return {
      systemId: meta.id,
      factors: {
        "day-sign": { key: "day-sign", label: "Day Sign", value: { daySign, signIndex }, display: daySign },
        tone: { key: "tone", label: "Galactic Tone", value: tone, display: String(tone) },
      },
    };
  },
};
