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

/**
 * Birth cards from the full date digits: reduce to ≤22 for the Personality card
 * (22 ≡ The Fool/0), then to a single digit for the Soul card.
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

    return {
      systemId: meta.id,
      factors: {
        personality: {
          key: "personality",
          label: "Personality Card",
          value: { card: MAJOR_ARCANA[personality], number: personality },
          display: `${MAJOR_ARCANA[personality]} (${personality})`,
        },
        soul: {
          key: "soul",
          label: "Soul Card",
          value: { card: MAJOR_ARCANA[soul], number: soul },
          display: `${MAJOR_ARCANA[soul]} (${soul})`,
        },
      },
    };
  },
};
