import type { BirthEvent } from "@/lib/core/birth-event";
import type { NativeResult, SystemEngine, SystemMeta } from "@/lib/core/contracts";
import { dateParts } from "@/lib/core/time";

export const meta: SystemMeta = {
  id: "mahabote",
  displayName: "Mahabote (Burmese)",
  lineage: "traditional",
  requires: { time: false, place: false },
  derivedFrom: "date",
  dependsOn: [],
  corpusVersion: "1",
};

/** Burmese weekday sign: ruling planet + mythical animal (date-deterministic). */
const WEEKDAY = [
  { day: "Sunday", planet: "Sun", animal: "Garuda" },
  { day: "Monday", planet: "Moon", animal: "Tiger" },
  { day: "Tuesday", planet: "Mars", animal: "Lion" },
  { day: "Wednesday", planet: "Mercury", animal: "Tusked Elephant" },
  { day: "Thursday", planet: "Jupiter", animal: "Rat" },
  { day: "Friday", planet: "Venus", animal: "Guinea Pig" },
  { day: "Saturday", planet: "Saturn", animal: "Naga" },
];

/**
 * The Burmese weekday sign (Nakha-zata) — the stable, date-deterministic core.
 * The fuller Mahabote house derivation (Binga/Ahta/… via year remainders) is a
 * later enhancement; we emit the verifiable weekday ruler + animal here.
 */
export const engine: SystemEngine = {
  meta,
  compute(birth: BirthEvent): NativeResult {
    const { year, month, day } = dateParts(birth);
    const w = WEEKDAY[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
    return {
      systemId: meta.id,
      factors: {
        sign: {
          key: "sign",
          label: "Weekday Sign",
          value: { day: w.day, planet: w.planet, animal: w.animal },
          display: `${w.planet} · ${w.animal} (${w.day})`,
        },
      },
    };
  },
};
