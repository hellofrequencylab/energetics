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
  corpusVersion: "3",
};

const MASTERS = new Set([11, 22, 33]);

/** Reduce to a single digit, preserving master numbers 11/22/33. */
export function reduce(n: number): number {
  let value = n;
  while (value > 9 && !MASTERS.has(value)) {
    value = String(value)
      .split("")
      .reduce((sum, d) => sum + Number(d), 0);
  }
  return value;
}

/** Reduce all the way to a single digit 1..9, never keeping a master. Used for
 * pinnacles and challenges, which are read as plain single digits in tradition. */
function reduceFull(n: number): number {
  let value = Math.abs(n);
  while (value > 9) {
    value = String(value)
      .split("")
      .reduce((sum, d) => sum + Number(d), 0);
  }
  return value;
}

/** Sum of every digit in a non-negative integer (e.g. 1950 → 15). */
function digitSum(n: number): number {
  return String(Math.abs(n))
    .split("")
    .reduce((sum, d) => sum + Number(d), 0);
}

/**
 * Date-derived numbers. Pure function of the birth date: no time, place, clock,
 * randomness, or I/O.
 *
 * Method, stated so the school is unambiguous:
 * - Life Path is the full digit sum of the whole date, reduced once at the end,
 *   so a master number (11/22/33) is preserved only when the final total reaches
 *   it. A master inside a single month or day (November, the 22nd) does NOT leak
 *   into the sum, which is the standard Pythagorean Life Path.
 * - Pinnacles and challenges are built from single-digit month, day, and year
 *   (each reduced all the way down first). Pinnacles are sums and may land on a
 *   master; challenges are absolute differences, so they always stay 0..8.
 *
 * Pinnacles and challenges follow the standard four-stage life cycle. We expose
 * only the timeless first-stage values here, since the engine is pure and never
 * reads a clock: the four pinnacles and four challenges are the lifelong
 * scaffold, not a time-stamped "where are you now" reading.
 */
export const engine: SystemEngine = {
  meta,
  compute(birth: BirthEvent): NativeResult {
    const { year, month, day } = dateParts(birth);

    // Single-digit month, day, and year, used for pinnacles and challenges. These
    // never carry a master number, which is what keeps challenges within 0..8.
    const sMonth = reduceFull(month);
    const sDay = reduceFull(day);
    const sYear = reduceFull(year);

    // Life Path: the through-line of the whole birth date, as a full digit sum
    // reduced once, so a master is preserved only at the final step.
    const lifePath = reduce(digitSum(year) + digitSum(month) + digitSum(day));

    // Birthday: the day of the month reduced, a master day (11/22) stays whole.
    const birthday = reduce(day);

    // Attitude: how you tend to meet the day, from month and day together.
    const attitude = reduce(sMonth + sDay);

    // Maturity: the later-life note, the Life Path and Birthday read together.
    const maturity = reduce(lifePath + birthday);

    // Main challenge: the gap between month and day, a difference so it stays 0..8.
    const challenge = reduceFull(Math.abs(sMonth - sDay));

    // Four Pinnacles: the high-water themes of the four life stages, each a sum
    // of two single-digit date parts. These follow the standard Pythagorean scheme.
    const pinnacle1 = reduce(sMonth + sDay);
    const pinnacle2 = reduce(sDay + sYear);
    const pinnacle3 = reduce(pinnacle1 + pinnacle2);
    const pinnacle4 = reduce(sMonth + sYear);

    // Four Challenges: the friction of each stage, read as differences so they
    // stay 0..8 and never reach a master number.
    const challenge1 = reduceFull(Math.abs(sMonth - sDay));
    const challenge2 = reduceFull(Math.abs(sDay - sYear));
    const challenge3 = reduceFull(Math.abs(challenge1 - challenge2));
    const challenge4 = reduceFull(Math.abs(sMonth - sYear));

    return {
      systemId: meta.id,
      factors: {
        "life-path": { key: "life-path", label: "Life Path", value: lifePath, display: String(lifePath) },
        birthday: { key: "birthday", label: "Birthday", value: birthday, display: String(birthday) },
        attitude: { key: "attitude", label: "Attitude", value: attitude, display: String(attitude) },
        maturity: { key: "maturity", label: "Maturity", value: maturity, display: String(maturity) },
        challenge: { key: "challenge", label: "Main Challenge", value: challenge, display: String(challenge) },
        pinnacles: {
          key: "pinnacles",
          label: "Pinnacles",
          value: { first: pinnacle1, second: pinnacle2, third: pinnacle3, fourth: pinnacle4 },
          display: `${pinnacle1}, ${pinnacle2}, ${pinnacle3}, ${pinnacle4}`,
        },
        challenges: {
          key: "challenges",
          label: "Challenges",
          value: { first: challenge1, second: challenge2, third: challenge3, fourth: challenge4 },
          display: `${challenge1}, ${challenge2}, ${challenge3}, ${challenge4}`,
        },
      },
    };
  },
};
