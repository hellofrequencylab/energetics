import type { BirthEvent } from "@/lib/core/birth-event";
import type { NativeResult, SystemEngine, SystemMeta } from "@/lib/core/contracts";
import { dateParts } from "@/lib/core/time";

export const meta: SystemMeta = {
  id: "numerology-pythagorean",
  displayName: "Numerology (Pythagorean)",
  lineage: "traditional",
  requires: { time: false, place: false },
  derivedFrom: "date",
  dependsOn: [],
  corpusVersion: "1",
};

/** Reduce to a single digit, preserving master numbers 11/22/33. */
export function reduce(n: number): number {
  const masters = new Set([11, 22, 33]);
  let value = n;
  while (value > 9 && !masters.has(value)) {
    value = String(value)
      .split("")
      .reduce((sum, d) => sum + Number(d), 0);
  }
  return value;
}

/**
 * Date-derived numbers. Pure function of the birth date: no time, place, clock,
 * randomness, or I/O. Master numbers (11/22/33) survive `reduce` where a sum can
 * reach them; difference-based numbers cannot reach a master and never preserve one.
 */
export const engine: SystemEngine = {
  meta,
  compute(birth: BirthEvent): NativeResult {
    const { year, month, day } = dateParts(birth);

    // Life Path: the through-line of the whole birth date.
    const lifePath = reduce(reduce(year) + reduce(month) + reduce(day));

    // Birthday: the day of the month reduced, a master day (11/22) stays whole.
    const birthday = reduce(day);

    // Attitude: how you tend to meet the day, from month and day together.
    const attitude = reduce(reduce(month) + reduce(day));

    // Maturity: the later-life note, the Life Path and Birthday read together.
    const maturity = reduce(lifePath + birthday);

    // Main challenge: the gap between month and day, a difference so it stays 0..8.
    const challenge = Math.abs(reduce(month) - reduce(day));

    return {
      systemId: meta.id,
      factors: {
        "life-path": { key: "life-path", label: "Life Path", value: lifePath, display: String(lifePath) },
        birthday: { key: "birthday", label: "Birthday", value: birthday, display: String(birthday) },
        attitude: { key: "attitude", label: "Attitude", value: attitude, display: String(attitude) },
        maturity: { key: "maturity", label: "Maturity", value: maturity, display: String(maturity) },
        challenge: { key: "challenge", label: "Main Challenge", value: challenge, display: String(challenge) },
      },
    };
  },
};
