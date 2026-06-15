import type { BirthEvent } from "@/lib/core/birth-event";
import type { NativeFactor, NativeResult, SystemEngine, SystemMeta } from "@/lib/core/contracts";
import { dateParts } from "@/lib/core/time";

export const meta: SystemMeta = {
  id: "nine-star-ki",
  displayName: "Nine Star Ki",
  lineage: "traditional",
  requires: { time: false, place: false },
  derivedFrom: "date",
  dependsOn: [],
  corpusVersion: "1",
};

/** The nine stars → element (Chinese Wu Xing), polarity, and common name. */
const STAR = [
  null,
  { name: "1 White", element: "water", polarity: "yin" },
  { name: "2 Black", element: "earth", polarity: "yin" },
  { name: "3 Jade", element: "wood", polarity: "yang" },
  { name: "4 Green", element: "wood", polarity: "yin" },
  { name: "5 Yellow", element: "earth", polarity: "balanced" },
  { name: "6 White", element: "metal", polarity: "yang" },
  { name: "7 Red", element: "metal", polarity: "yin" },
  { name: "8 White", element: "earth", polarity: "yang" },
  { name: "9 Purple", element: "fire", polarity: "yang" },
] as const;

/**
 * The Nine Star Ki "year" begins at risshun (~Feb 4), so births before then use
 * the previous year. The same boundary divides the twelve solar months that the
 * monthly star table is keyed on, each opening near a major solar term.
 */
const SOLAR_YEAR_START = { month: 2, day: 4 };

/**
 * Solar-month index 0..11 for the monthly star, counted from the risshun new
 * year. The twelve months open near these civil dates (the major solar terms);
 * a birth before the month's opening day belongs to the previous month. This is
 * the conventional civil-date approximation, deterministic and timezone-free.
 */
const MONTH_STARTS: { month: number; day: number }[] = [
  { month: 2, day: 4 }, // 1: 立春 risshun
  { month: 3, day: 6 }, // 2: 啓蟄
  { month: 4, day: 5 }, // 3: 清明
  { month: 5, day: 6 }, // 4: 立夏
  { month: 6, day: 6 }, // 5: 芒種
  { month: 7, day: 7 }, // 6: 小暑
  { month: 8, day: 8 }, // 7: 立秋
  { month: 9, day: 8 }, // 8: 白露
  { month: 10, day: 8 }, // 9: 寒露
  { month: 11, day: 7 }, // 10: 立冬
  { month: 12, day: 7 }, // 11: 大雪
  { month: 1, day: 6 }, // 12: 小寒 (belongs to the prior risshun year)
];

const mod9 = (n: number) => (((n - 1) % 9) + 9) % 9 + 1;

/** Principal (Honmei) star from a risshun-adjusted year. 1985→6, 2022→5, 2024→3. */
function yearStar(y: number): number {
  return (((11 - (y % 9) - 1) % 9) + 9) % 9 + 1;
}

/**
 * Solar-month index 0..11 from a civil date, counted from risshun. Each month
 * runs from its opening day to the next month's opening day.
 */
function solarMonthIndex(month: number, day: number): number {
  // Walk the eleven February-to-December openings; the last one at or before the
  // date wins. The default (idx 11, 小寒) covers two cases that the loop cannot:
  // late January on/after 小寒 (Jan 6), and early February before 立春 (Feb 4).
  let idx = 11;
  for (let i = 0; i < 11; i++) {
    const s = MONTH_STARTS[i];
    if (month > s.month || (month === s.month && day >= s.day)) idx = i;
  }
  // Early January, before 小寒 (Jan 6), still belongs to the prior 大雪 month.
  if (month === 1 && day < MONTH_STARTS[11].day) idx = 10;
  return idx;
}

/**
 * Monthly (Getsumei) star. The classic table groups year stars into three
 * families (by year-star mod 3) and assigns the first solar month a starting
 * star, then counts down by one each month. We encode the three starting points
 * directly: families {1,4,7} start at 8, {2,5,8} start at 2, {3,6,9} start at 5.
 */
function monthStar(principal: number, monthIdx: number): number {
  const fam = principal % 3; // 1→1, 4→1, 7→1 ; 2→2,5→2,8→2 ; 3→0,6→0,9→0
  const start = fam === 1 ? 8 : fam === 2 ? 2 : 5;
  return mod9(start - monthIdx);
}

/**
 * Nine Star Ki. The principal (year) star is the verified core. We add the
 * monthly (personal/emotional) star from the solar month, and a tendency star
 * read as the principal's complement on the magic-square center (5), which names
 * a quality the principal reaches toward. All date-deterministic and pure.
 */
export const engine: SystemEngine = {
  meta,
  compute(birth: BirthEvent): NativeResult {
    const { year, month, day } = dateParts(birth);
    const beforeNewYear =
      month < SOLAR_YEAR_START.month ||
      (month === SOLAR_YEAR_START.month && day < SOLAR_YEAR_START.day);
    const y = beforeNewYear ? year - 1 : year;

    const principal = yearStar(y);
    const p = STAR[principal]!;

    const monthIdx = solarMonthIndex(month, day);
    const monthly = monthStar(principal, monthIdx);
    const m = STAR[monthly]!;

    // Tendency star: the number that pairs with the principal across the center 5
    // of the Lo Shu magic square (a known reflection, principal + tendency = 10,
    // with 5 reflecting to itself). It names a balancing quality the person draws
    // toward, distinct from but related to the principal.
    const tendency = principal === 5 ? 5 : 10 - principal;
    const t = STAR[tendency]!;

    const factors: Record<string, NativeFactor> = {
      "principal-star": {
        key: "principal-star",
        label: "Principal Star",
        value: { star: principal, name: p.name, element: p.element, polarity: p.polarity },
        display: `${p.name} ${cap(p.element)}`,
      },
      "monthly-star": {
        key: "monthly-star",
        label: "Monthly Star",
        value: { star: monthly, name: m.name, element: m.element, polarity: m.polarity, monthIndex: monthIdx + 1 },
        display: `${m.name} ${cap(m.element)}`,
      },
      "tendency-star": {
        key: "tendency-star",
        label: "Tendency Star",
        value: { star: tendency, name: t.name, element: t.element, polarity: t.polarity },
        display: `${t.name} ${cap(t.element)}`,
      },
    };

    return { systemId: meta.id, factors };
  },
};

function cap(x: string): string {
  return x.charAt(0).toUpperCase() + x.slice(1);
}
