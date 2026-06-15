import type { BirthEvent } from "@/lib/core/birth-event";
import type { NativeResult, SystemEngine, SystemMeta } from "@/lib/core/contracts";

export const meta: SystemMeta = {
  id: "akan-day-names",
  displayName: "Akan Day Names (Kra Din)",
  lineage: "traditional",
  requires: { time: false, place: false },
  derivedFrom: "date",
  dependsOn: [],
  corpusVersion: "2",
};

type AkanElement = "fire" | "earth" | "air" | "water";
type AkanPolarity = "active" | "receptive" | "balanced";

/**
 * Akan day-name lore, keyed by weekday (0=Sun..6=Sat). In Akan custom a child
 * receives a kra din (soul name) from the day of birth, and each day carries a
 * presiding spirit (an obosom or kra) and a settled character. We add, in our own
 * plain words, a guiding quality, a classical element, and an active/receptive
 * read of each day's temperament, all fixed by the weekday alone.
 *
 * `male`/`female` are the customary soul names. `kra` is the day's spirit/soul
 * name as it is commonly given. `trait` is the traditional character in brief.
 * `quality`, `element`, and `polarity` are our own schematic reading.
 */
const DAYS: {
  day: string;
  akanDay: string;
  male: string;
  female: string;
  kra: string;
  trait: string;
  quality: string;
  element: AkanElement;
  polarity: AkanPolarity;
}[] = [
  {
    day: "Sunday",
    akanDay: "Kwasiada",
    male: "Kwasi",
    female: "Akosua",
    kra: "Awusi",
    trait: "leader, protective (the universe)",
    quality: "leadership and watchful care",
    element: "fire",
    polarity: "active",
  },
  {
    day: "Monday",
    akanDay: "Dwoada",
    male: "Kwadwo",
    female: "Adwoa",
    kra: "Adwo",
    trait: "peaceful, calm",
    quality: "peace and steady calm",
    element: "water",
    polarity: "receptive",
  },
  {
    day: "Tuesday",
    akanDay: "Benada",
    male: "Kwabena",
    female: "Abena",
    kra: "Abena",
    trait: "compassionate (the ocean)",
    quality: "compassion and deep feeling",
    element: "water",
    polarity: "balanced",
  },
  {
    day: "Wednesday",
    akanDay: "Wukuada",
    male: "Kwaku",
    female: "Akua",
    kra: "Aku",
    trait: "quick, heroic (Ananse)",
    quality: "quick wit and bold cunning",
    element: "air",
    polarity: "active",
  },
  {
    day: "Thursday",
    akanDay: "Yawoada",
    male: "Yaw",
    female: "Yaa",
    kra: "Ayaw",
    trait: "brave, protective (the earth)",
    quality: "courage and grounded strength",
    element: "earth",
    polarity: "active",
  },
  {
    day: "Friday",
    akanDay: "Fiada",
    male: "Kofi",
    female: "Afua",
    kra: "Afi",
    trait: "adventurous, nurturing (fertility)",
    quality: "venturing and nurturing growth",
    element: "earth",
    polarity: "balanced",
  },
  {
    day: "Saturday",
    akanDay: "Memeneda",
    male: "Kwame",
    female: "Ama",
    kra: "Amen",
    trait: "wise, an old soul (the ancient)",
    quality: "wisdom and long memory",
    element: "air",
    polarity: "receptive",
  },
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
          value: {
            day: d.day,
            akanDay: d.akanDay,
            male: d.male,
            female: d.female,
            trait: d.trait,
          },
          display: `${d.male} / ${d.female} (${d.day})`,
        },
        character: { key: "character", label: "Character", value: d.trait, display: d.trait },
        kra: {
          key: "kra",
          label: "Kra (day spirit)",
          value: { kra: d.kra, akanDay: d.akanDay },
          display: `${d.kra} (${d.akanDay})`,
        },
        quality: { key: "quality", label: "Guiding Quality", value: d.quality, display: d.quality },
        element: {
          key: "element",
          label: "Element",
          value: d.element,
          display: d.element.charAt(0).toUpperCase() + d.element.slice(1),
        },
        polarity: {
          key: "polarity",
          label: "Polarity",
          value: d.polarity,
          display:
            d.polarity === "active"
              ? "Active, outgoing"
              : d.polarity === "receptive"
                ? "Receptive, settling"
                : "Balanced",
        },
      },
    };
  },
};

export const AKAN_DAYS = DAYS;
