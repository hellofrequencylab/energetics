import type { BirthEvent } from "@/lib/core/birth-event";
import type { NativeFactor, NativeResult, SystemEngine, SystemMeta } from "@/lib/core/contracts";
import { dateParts } from "@/lib/core/time";

export const meta: SystemMeta = {
  id: "tibetan-astrology",
  displayName: "Tibetan Astrology",
  lineage: "traditional",
  requires: { time: false, place: false },
  derivedFrom: "date",
  dependsOn: [],
  corpusVersion: "1",
};

/**
 * The twelve animals of the Tibetan year cycle, in order. The cycle aligns with
 * the wider East Asian animal year; the Tibetan new year (Losar) falls in late
 * winter, so a birth before Losar belongs to the previous animal year. We use a
 * fixed early-February civil boundary as a deterministic, timezone-free approxi-
 * mation of Losar (it varies year to year in the true lunar calendar).
 */
const ANIMALS = [
  "Rat", "Ox", "Tiger", "Rabbit", "Dragon", "Snake",
  "Horse", "Sheep", "Monkey", "Bird", "Dog", "Pig",
] as const;

/**
 * The five Tibetan elements (jung wa nga). Each element governs two consecutive
 * years, a yang ("male") year then a yin ("female") year, so the element changes
 * every two years and the full element-animal round takes sixty years. Mapped to
 * the Chinese five-phase namespace for the ontology element axis.
 */
const ELEMENTS = ["wood", "fire", "earth", "metal", "water"] as const;

/**
 * The eight parkha, the trigrams of the Tibetan version of the bagua. Each pairs
 * with an element and a direction and reads as a life-force quality. Names are the
 * common Tibetan trigram names; the readings below are our own plain summaries.
 */
const PARKHA = [
  { name: "Li", element: "fire", quality: "brightness and clarity" },
  { name: "Khon", element: "earth", quality: "receptive support" },
  { name: "Dva", element: "metal", quality: "joy and openness" },
  { name: "Khen", element: "metal", quality: "strength and authority" },
  { name: "Kham", element: "water", quality: "depth and danger crossed" },
  { name: "Gin", element: "earth", quality: "stillness and pause" },
  { name: "Zin", element: "wood", quality: "movement and arousal" },
  { name: "Zon", element: "wood", quality: "gentle persistence" },
] as const;

/**
 * The nine mewa, the magic-square numbers (the same Lo Shu grid the Chinese and
 * Japanese nine-star systems use), each with a color and an element. The mewa
 * cycles by year and names a protective-energy signature for the person.
 */
const MEWA = [
  null,
  { name: "1 White", element: "water" },
  { name: "2 Black", element: "earth" },
  { name: "3 Indigo", element: "wood" },
  { name: "4 Green", element: "wood" },
  { name: "5 Yellow", element: "earth" },
  { name: "6 White", element: "metal" },
  { name: "7 Red", element: "metal" },
  { name: "8 White", element: "earth" },
  { name: "9 Maroon", element: "fire" },
] as const;

const mod = (n: number, m: number) => ((n % m) + m) % m;

/**
 * Tibetan astrology (naktsi, the elemental strand). All factors are read from the
 * birth year of the Tibetan calendar: the animal and element of the year, the
 * yang/yin gender of the year, the parkha trigram, and the mewa number. We use a
 * fixed civil-date Losar boundary (early February) so the reading is deterministic
 * and timezone-free. This is an original deterministic implementation of the
 * schematic, not reproduced corpora, and is pure (date in, figure out, no I/O).
 *
 * Anchor: 1984 was the Wood Rat year that opened a sixty-year cycle, so we count
 * the animal and element from there.
 */
export const engine: SystemEngine = {
  meta,
  compute(birth: BirthEvent): NativeResult {
    const { year, month, day } = dateParts(birth);
    // Losar approximation: before ~Feb 10, use the previous Tibetan year.
    const beforeLosar = month === 1 || (month === 2 && day < 10);
    const ty = beforeLosar ? year - 1 : year;

    // Offset from the 1984 Wood Rat anchor (start of a sixty-year cycle).
    const offset = ty - 1984;

    const animal = ANIMALS[mod(offset, 12)];
    // Element advances every two years; within each two-year block the first year
    // is yang and the second is yin.
    const element = ELEMENTS[mod(Math.floor(offset / 2), 5)];
    const gender = mod(offset, 2) === 0 ? "yang" : "yin";

    // Parkha: the trigram cycles through the eight by year. We index from the
    // anchor so the round is stable and deterministic.
    const parkha = PARKHA[mod(offset, 8)];

    // Mewa: the nine numbers count DOWN by one each year (the descending mewa
    // sequence). 1984 (Wood Rat) is mewa 7, a common anchor, so we count from it.
    const mewaNum = mod(7 - 1 - offset, 9) + 1;
    const mewa = MEWA[mewaNum]!;

    // A simple harmony read: when the year element and the parkha element match,
    // the life-force and the year reinforce each other (a supported footing).
    const harmony = element === parkha.element ? "reinforced" : "mixed";

    const factors: Record<string, NativeFactor> = {
      "year-animal": {
        key: "year-animal",
        label: "Year Animal",
        value: { animal, gender },
        display: `${cap(gender)} ${animal}`,
      },
      "year-element": {
        key: "year-element",
        label: "Year Element",
        value: { element, gender },
        display: `${cap(gender)} ${cap(element)}`,
      },
      parkha: {
        key: "parkha",
        label: "Parkha (Trigram)",
        value: { name: parkha.name, element: parkha.element, quality: parkha.quality, harmony },
        display: `${parkha.name} (${cap(parkha.element)})`,
      },
      mewa: {
        key: "mewa",
        label: "Mewa (Magic Number)",
        value: { number: mewaNum, name: mewa.name, element: mewa.element },
        display: `${mewa.name} ${cap(mewa.element)}`,
      },
    };

    return { systemId: meta.id, factors };
  },
};

function cap(x: string): string {
  return x ? x.charAt(0).toUpperCase() + x.slice(1) : x;
}
