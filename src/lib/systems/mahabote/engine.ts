import type { BirthEvent } from "@/lib/core/birth-event";
import type { NativeFactor, NativeResult, SystemEngine, SystemMeta } from "@/lib/core/contracts";
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
 * The seven planets in their Mahabote sequence (the order they are seated around
 * the figure). Each carries a five-phase-style element read used downstream.
 */
const PLANET_SEQUENCE = ["Sun", "Moon", "Mars", "Mercury", "Saturn", "Jupiter", "Venus"] as const;
type Planet = (typeof PLANET_SEQUENCE)[number];

/**
 * The seven Mahabote houses (positions a planet can occupy), each a station with
 * its own character. Names follow the Burmese tradition; readings here are our own
 * plain-language summaries, not reproduced text.
 *  - Binga: the self, the seed and starting nature
 *  - Ahta: gain and resources, what comes in
 *  - Yaza: standing and authority, the public face
 *  - Adipati: mastery and power, the strong house
 *  - Marana: loss and endings, where energy drains
 *  - Thike: support and steadiness, the helping house
 *  - Puti: increase and family, what grows around you
 */
const HOUSES = ["Binga", "Ahta", "Yaza", "Adipati", "Marana", "Thike", "Puti"] as const;
type House = (typeof HOUSES)[number];

/** The strong, favorable houses vs the testing ones, for a simple tone read. */
const FAVORABLE_HOUSES = new Set<House>(["Adipati", "Ahta", "Puti", "Yaza"]);

const PLANET_TONE: Record<Planet, "active" | "receptive"> = {
  Sun: "active",
  Moon: "receptive",
  Mars: "active",
  Mercury: "receptive",
  Saturn: "receptive",
  Jupiter: "active",
  Venus: "receptive",
};

const mod7 = (n: number) => ((n % 7) + 7) % 7;

/**
 * Mahabote (Burmese). The weekday sign is the verifiable date-deterministic core.
 * On top of it we build the seven-house figure: the seven planets are seated
 * around the houses, starting the count from the weekday ruler and stepping by a
 * year-derived offset, the classic Burmese remainder construction. This is an
 * original deterministic implementation of the schematic, not reproduced corpora,
 * and is pure (civil date in, figure out, no I/O).
 */
export const engine: SystemEngine = {
  meta,
  compute(birth: BirthEvent): NativeResult {
    const { year, month, day } = dateParts(birth);
    const weekdayIdx = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
    const w = WEEKDAY[weekdayIdx];

    // The ruling planet's index within the Mahabote planet sequence anchors the
    // figure. The year remainder (year mod 7) rotates the seating, so people born
    // on the same weekday in different years carry different figures.
    const rulerIdx = PLANET_SEQUENCE.indexOf(w.planet as Planet);
    const yearRemainder = mod7(year);

    // Seat the seven planets into the seven houses. We start at the ruler's planet
    // in house Binga and step forward by (1 + yearRemainder) each house, walking
    // the planet sequence. The result is a stable bijection: each house holds one
    // planet and each planet one house.
    const step = 1 + (yearRemainder % 6); // 1..6, never 0 or 7 (keeps it a rotation)
    const planetOfHouse: Record<House, Planet> = {} as Record<House, Planet>;
    const houseOfPlanet: Record<Planet, House> = {} as Record<Planet, House>;
    for (let i = 0; i < 7; i++) {
      const planet = PLANET_SEQUENCE[mod7(rulerIdx + i * step)];
      const house = HOUSES[i];
      planetOfHouse[house] = planet;
      houseOfPlanet[planet] = house;
    }

    // The two readings people care about most:
    //  - the house your RULING planet lands in (your seed planet's station)
    //  - the planet sitting in your Binga house (the seed/self house)
    const rulerHouse = houseOfPlanet[w.planet as Planet];
    const bingaPlanet = planetOfHouse.Binga;
    const adipatiPlanet = planetOfHouse.Adipati; // your house of mastery
    const maranaPlanet = planetOfHouse.Marana; // your testing house

    const rulerTone = FAVORABLE_HOUSES.has(rulerHouse) ? "favorable" : "testing";

    const factors: Record<string, NativeFactor> = {
      sign: {
        key: "sign",
        label: "Weekday Sign",
        value: { day: w.day, planet: w.planet, animal: w.animal, polarity: PLANET_TONE[w.planet as Planet] },
        display: `${w.planet} · ${w.animal} (${w.day})`,
      },
      "ruling-house": {
        key: "ruling-house",
        label: "Ruling Planet House",
        value: { planet: w.planet, house: rulerHouse, tone: rulerTone },
        display: `${w.planet} in ${rulerHouse} (${rulerTone})`,
      },
      "binga-planet": {
        key: "binga-planet",
        label: "Binga (Self) Planet",
        value: { planet: bingaPlanet, polarity: PLANET_TONE[bingaPlanet] },
        display: `${bingaPlanet} in Binga`,
      },
      "adipati-planet": {
        key: "adipati-planet",
        label: "Adipati (Mastery) Planet",
        value: { planet: adipatiPlanet, polarity: PLANET_TONE[adipatiPlanet] },
        display: `${adipatiPlanet} in Adipati`,
      },
      "marana-planet": {
        key: "marana-planet",
        label: "Marana (Testing) Planet",
        value: { planet: maranaPlanet, polarity: PLANET_TONE[maranaPlanet] },
        display: `${maranaPlanet} in Marana`,
      },
      figure: {
        key: "figure",
        label: "Mahabote Figure",
        value: { planetOfHouse, houseOfPlanet, yearRemainder },
        display: HOUSES.map((h) => `${h}:${planetOfHouse[h]}`).join(" · "),
      },
    };

    return { systemId: meta.id, factors };
  },
};
