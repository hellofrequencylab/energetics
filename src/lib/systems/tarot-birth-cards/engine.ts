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
  corpusVersion: "1",
};

export const MAJOR_ARCANA = [
  "The Fool", "The Magician", "The High Priestess", "The Empress", "The Emperor",
  "The Hierophant", "The Lovers", "The Chariot", "Strength", "The Hermit",
  "Wheel of Fortune", "Justice", "The Hanged Man", "Death", "Temperance",
  "The Devil", "The Tower", "The Star", "The Moon", "The Sun", "Judgement", "The World",
];

const sumDigits = (n: number) => String(n).split("").reduce((s, d) => s + Number(d), 0);

/** Build the native card value for a Major Arcana index (0..21). */
const cardAt = (index: number) => ({ card: MAJOR_ARCANA[index], number: index });

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

    return { systemId: meta.id, factors };
  },
};
