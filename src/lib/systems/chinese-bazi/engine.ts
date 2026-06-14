import { Solar } from "lunar-typescript";
import type { BirthEvent } from "@/lib/core/birth-event";
import type { NativeResult, SystemEngine, SystemMeta } from "@/lib/core/contracts";
import { dateParts, timeParts } from "@/lib/core/time";

export const meta: SystemMeta = {
  id: "chinese-bazi",
  displayName: "Chinese BaZi (Four Pillars)",
  lineage: "traditional",
  requires: { time: true, place: false },
  derivedFrom: "date",
  dependsOn: [],
  corpusVersion: "1",
};

// Heavenly Stems → element + polarity.
const STEM_ELEMENT: Record<string, string> = {
  甲: "wood", 乙: "wood", 丙: "fire", 丁: "fire", 戊: "earth",
  己: "earth", 庚: "metal", 辛: "metal", 壬: "water", 癸: "water",
};
const STEM_POLARITY: Record<string, string> = {
  甲: "Yang", 乙: "Yin", 丙: "Yang", 丁: "Yin", 戊: "Yang",
  己: "Yin", 庚: "Yang", 辛: "Yin", 壬: "Yang", 癸: "Yin",
};
const BRANCH_ANIMAL: Record<string, string> = {
  子: "Rat", 丑: "Ox", 寅: "Tiger", 卯: "Rabbit", 辰: "Dragon", 巳: "Snake",
  午: "Horse", 未: "Goat", 申: "Monkey", 酉: "Rooster", 戌: "Dog", 亥: "Pig",
};

/** Phase 1 minimal output: zodiac animal + Day Master (element + polarity). */
export const engine: SystemEngine = {
  meta,
  compute(birth: BirthEvent): NativeResult {
    const { year, month, day } = dateParts(birth);
    const { hour, minute } = timeParts(birth);
    const solar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
    const ec = solar.getLunar().getEightChar();

    const yearZhi = ec.getYearZhi();
    const dayGan = ec.getDayGan();
    const animal = BRANCH_ANIMAL[yearZhi] ?? yearZhi;
    const dayElement = STEM_ELEMENT[dayGan] ?? "";
    const dayPolarity = STEM_POLARITY[dayGan] ?? "";

    // The Four Pillars themselves (year, month, day, hour), each a heavenly stem
    // over an earthly branch. Native display data for the chart diagram.
    const pillar = (stem: string, branch: string): Pillar => ({
      stem,
      branch,
      element: STEM_ELEMENT[stem] ?? "",
      polarity: STEM_POLARITY[stem] ?? "",
      animal: BRANCH_ANIMAL[branch] ?? branch,
    });
    const pillars = {
      year: pillar(ec.getYearGan(), ec.getYearZhi()),
      month: pillar(ec.getMonthGan(), ec.getMonthZhi()),
      day: pillar(ec.getDayGan(), ec.getDayZhi()),
      hour: pillar(ec.getTimeGan(), ec.getTimeZhi()),
    };

    // Element balance across the four heavenly stems. A simple, deterministic
    // tally of the same stem elements already computed above (no extra library
    // calls), used to surface the dominant element across the chart. `dominant`
    // breaks ties by a stable generative-cycle order so the result is stable.
    const elements = elementCounts([
      pillars.year.element,
      pillars.month.element,
      pillars.day.element,
      pillars.hour.element,
    ]);
    const dominant = dominantElement(elements);

    return {
      systemId: meta.id,
      factors: {
        animal: { key: "animal", label: "Zodiac Animal", value: { animal, yearGanZhi: ec.getYear() }, display: animal },
        "day-master": {
          key: "day-master",
          label: "Day Master",
          value: { element: dayElement, polarity: dayPolarity, stem: dayGan },
          display: `${dayPolarity} ${cap(dayElement)}`,
        },
        pillars: {
          key: "pillars",
          label: "Four Pillars",
          value: pillars,
          display: `${pillars.year.stem}${pillars.year.branch} ${pillars.month.stem}${pillars.month.branch} ${pillars.day.stem}${pillars.day.branch} ${pillars.hour.stem}${pillars.hour.branch}`,
        },
        elements: {
          key: "elements",
          label: "Element Balance",
          value: { counts: elements, dominant },
          display: dominant ? cap(dominant) : "",
        },
      },
    };
  },
};

export interface Pillar {
  stem: string;
  branch: string;
  element: string; // wood | fire | earth | metal | water
  polarity: string; // Yang | Yin
  animal: string;
}

/** Canonical five-phase order (the generative cycle), used for stable output. */
const WU_XING = ["wood", "fire", "earth", "metal", "water"] as const;
type WuXing = (typeof WU_XING)[number];

/** Tally the five elements across a list of pillar elements. Always returns all
 * five keys (zero-filled) so the shape is stable regardless of birth moment. */
function elementCounts(elements: string[]): Record<WuXing, number> {
  const counts: Record<WuXing, number> = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  for (const el of elements) {
    if (el && el in counts) counts[el as WuXing] += 1;
  }
  return counts;
}

/** Highest-count element. Ties break by generative-cycle order for determinism;
 * returns "" only if there were no countable elements. */
function dominantElement(counts: Record<WuXing, number>): string {
  let best = "";
  let bestCount = 0;
  for (const el of WU_XING) {
    if (counts[el] > bestCount) {
      best = el;
      bestCount = counts[el];
    }
  }
  return best;
}

function cap(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}
