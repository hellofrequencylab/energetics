import type { BirthEvent } from "@/lib/core/birth-event";
import type { NativeResult, SystemEngine, SystemMeta } from "@/lib/core/contracts";

export const meta: SystemMeta = {
  id: "akan-day-names",
  displayName: "Akan Day Names (Kra Din)",
  lineage: "traditional",
  requires: { time: false, place: false },
  derivedFrom: "date",
  dependsOn: [],
  corpusVersion: "1",
};

/** Weekday (0=Sun..6=Sat) → Akan soul-name (male/female) + traditional character. */
const DAYS = [
  { day: "Sunday", male: "Kwasi", female: "Akosua", trait: "leader, protective (the universe)" },
  { day: "Monday", male: "Kwadwo", female: "Adwoa", trait: "peaceful, calm" },
  { day: "Tuesday", male: "Kwabena", female: "Abena", trait: "compassionate (the ocean)" },
  { day: "Wednesday", male: "Kwaku", female: "Akua", trait: "quick, heroic (Ananse)" },
  { day: "Thursday", male: "Yaw", female: "Yaa", trait: "brave, protective (the earth)" },
  { day: "Friday", male: "Kofi", female: "Afua", trait: "adventurous, nurturing (fertility)" },
  { day: "Saturday", male: "Kwame", female: "Ama", trait: "wise, an old soul (the ancient)" },
];

/** Pure weekday from the civil date (timezone-proof, integer space). */
function weekday(year: number, month: number, day: number): number {
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export const engine: SystemEngine = {
  meta,
  compute(birth: BirthEvent): NativeResult {
    const [year, month, day] = birth.date.split("-").map(Number);
    const d = DAYS[weekday(year, month, day)];
    return {
      systemId: meta.id,
      factors: {
        "day-name": {
          key: "day-name",
          label: "Kra Din",
          value: { day: d.day, male: d.male, female: d.female, trait: d.trait },
          display: `${d.male} / ${d.female} (${d.day})`,
        },
        character: { key: "character", label: "Character", value: d.trait, display: d.trait },
      },
    };
  },
};

export const AKAN_DAYS = DAYS;
