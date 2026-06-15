import type { BirthEvent } from "@/lib/core/birth-event";
import type { NativeResult, SystemEngine, SystemMeta } from "@/lib/core/contracts";
import { dateParts } from "@/lib/core/time";

export const meta: SystemMeta = {
  id: "tarot-birth-cards",
  displayName: "Tarot Birth Cards",
  lineage: "hybrid",
  requires: { time: false, place: false },
  derivedFrom: "date",
  // Hard derivation: same date-digit reduction as Pythagorean numerology, so
  // synthesis must treat the two as one source, not independent corroboration.
  dependsOn: ["numerology-pythagorean"],
  corpusVersion: "2",
};

export const MAJOR_ARCANA = [
  "The Fool", "The Magician", "The High Priestess", "The Empress", "The Emperor",
  "The Hierophant", "The Lovers", "The Chariot", "Strength", "The Hermit",
  "Wheel of Fortune", "Justice", "The Hanged Man", "Death", "Temperance",
  "The Devil", "The Tower", "The Star", "The Moon", "The Sun", "Judgement", "The World",
];

/**
 * Elemental dignity of each Major Arcana, from the widely shared astrological
 * attributions of the trumps (planet, sign, or classical element). We collapse
 * those attributions to one of the four Western elements and name them in our own
 * words. Planets are read through the element they most naturally express here, so
 * every trump carries a single, stable element. Used for the suit/element factor.
 */
const ARCANA_ELEMENT: Record<number, "fire" | "earth" | "air" | "water"> = {
  0: "air", // Fool (Air)
  1: "air", // Magician (Mercury, mind)
  2: "water", // High Priestess (Moon)
  3: "earth", // Empress (Venus, fertile ground)
  4: "fire", // Emperor (Aries)
  5: "earth", // Hierophant (Taurus)
  6: "air", // Lovers (Gemini)
  7: "water", // Chariot (Cancer)
  8: "fire", // Strength (Leo)
  9: "earth", // Hermit (Virgo)
  10: "fire", // Wheel (Jupiter, expansion)
  11: "air", // Justice (Libra)
  12: "water", // Hanged Man (Water)
  13: "water", // Death (Scorpio)
  14: "fire", // Temperance (Sagittarius)
  15: "earth", // Devil (Capricorn)
  16: "fire", // Tower (Mars)
  17: "air", // Star (Aquarius)
  18: "water", // Moon (Pisces)
  19: "fire", // Sun (Sun)
  20: "fire", // Judgement (Fire)
  21: "earth", // World (Saturn, the manifest whole)
};

/** The Minor Arcana suit each element governs, named for the reader. */
const ELEMENT_SUIT: Record<string, string> = {
  fire: "Wands",
  earth: "Pentacles",
  air: "Swords",
  water: "Cups",
};

const sumDigits = (n: number) => String(n).split("").reduce((s, d) => s + Number(d), 0);

/** Build the native card value for a Major Arcana index (0..21). */
const cardAt = (index: number) => ({
  card: MAJOR_ARCANA[index],
  number: index,
  element: ARCANA_ELEMENT[index],
});

/**
 * Birth cards from the full date digits: reduce to ≤22 for the Personality card
 * (22 ≡ The Fool/0), then to a single digit for the Soul card.
 *
 * A teacher card is surfaced from the same numeric family as the Soul card: the
 * Major Arcana whose number is the single-digit Soul number plus nine. Soul (1..9)
 * and Soul+9 reduce to the same root, so they form a constellation, two octaves
 * of one lesson. The teacher is the higher-numbered octave, the more demanding
 * face of the same theme. It is emitted only when Soul+9 is a real Major (<= 21)
 * and differs from the Personality card, so it never just repeats another factor.
 *
 * Three further factors are read off the same numbers, no clock and no new input:
 *  - element/suit: the elemental dignity of the Soul card, the family of energy
 *    it draws on, named as its Minor Arcana suit for the reader.
 *  - polarity: even Soul numbers read receptive, odd ones active (The Fool/0 is
 *    the open, receptive beginning), matching the sibling numerology rule.
 *  - constellation: whether the Personality and Soul cards share a number, in
 *    which case the outer and inner reading double onto one theme.
 *
 * This is a pure function of the birth date and reuses the existing reduction
 * logic only (no clock, no current-year input).
 */
export const engine: SystemEngine = {
  meta,
  compute(birth: BirthEvent): NativeResult {
    const { year, month, day } = dateParts(birth);
    const digits = `${year}${String(month).padStart(2, "0")}${String(day).padStart(2, "0")}`;
    let reduced = digits.split("").reduce((s, d) => s + Number(d), 0);
    while (reduced > 22) reduced = sumDigits(reduced);

    const personality = reduced % 22; // 22 → 0 (The Fool)
    let soulN = reduced;
    while (soulN > 9) soulN = sumDigits(soulN);
    const soul = soulN % 22;

    const factors: NativeResult["factors"] = {
      personality: {
        key: "personality",
        label: "Personality Card",
        value: cardAt(personality),
        display: `${MAJOR_ARCANA[personality]} (${personality})`,
      },
      soul: {
        key: "soul",
        label: "Soul Card",
        value: cardAt(soul),
        display: `${MAJOR_ARCANA[soul]} (${soul})`,
      },
    };

    // Teacher card: the higher octave in the Soul card's numeric family (Soul+9).
    // Emitted only when it is a real Major and not already the Personality card.
    const teacherN = soul + 9;
    if (teacherN <= 21 && teacherN !== personality) {
      factors.teacher = {
        key: "teacher",
        label: "Teacher Card",
        value: cardAt(teacherN),
        display: `${MAJOR_ARCANA[teacherN]} (${teacherN})`,
      };
    }

    // Elemental dignity of the Soul card, named as its Minor Arcana suit.
    const element = ARCANA_ELEMENT[soul];
    const suit = ELEMENT_SUIT[element];
    factors.element = {
      key: "element",
      label: "Elemental Suit",
      value: { element, suit },
      display: `${suit} (${element})`,
    };

    // Polarity of the Soul number: even receptive, odd active.
    const polarity = soul % 2 === 1 ? "active" : "receptive";
    factors.polarity = {
      key: "polarity",
      label: "Card Polarity",
      value: polarity,
      display: polarity === "active" ? "Active, initiating" : "Receptive, gathering",
    };

    // Constellation: the outer and inner cards landing on one number doubles the
    // theme. This is a pure read of the two numbers already computed.
    const doubled = personality === soul;
    factors.constellation = {
      key: "constellation",
      label: "Constellation",
      value: { doubled, root: soulN },
      display: doubled
        ? `Doubled on ${MAJOR_ARCANA[soul]} (root ${soulN})`
        : `Paired, root ${soulN}`,
    };

    return { systemId: meta.id, factors };
  },
};
