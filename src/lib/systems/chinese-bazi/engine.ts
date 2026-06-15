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
// Earthly branches → their own (hidden-stem-led) five-phase element. Used to read
// the branch layer of each pillar, which the stem tally alone misses.
const BRANCH_ELEMENT: Record<string, string> = {
  子: "water", 丑: "earth", 寅: "wood", 卯: "wood", 辰: "earth", 巳: "fire",
  午: "fire", 未: "earth", 申: "metal", 酉: "metal", 戌: "earth", 亥: "water",
};

// The Ten Gods (十神) the library returns for the day master and each other stem,
// translated to a plain English label. 日主 marks the day master (you) itself.
const TEN_GODS: Record<string, string> = {
  日主: "Day Master",
  比肩: "Friend",
  劫财: "Rob Wealth",
  食神: "Eating God",
  伤官: "Hurting Officer",
  偏财: "Indirect Wealth",
  正财: "Direct Wealth",
  七杀: "Seven Killings",
  正官: "Direct Officer",
  偏印: "Indirect Resource",
  正印: "Direct Resource",
};

// The twelve growth stages (十二长生) a stem passes through on a branch. A simple
// vitality reading of where the day master sits, from birth through peak to rest.
const GROWTH_STAGE: Record<string, string> = {
  长生: "Birth",
  沐浴: "Bath",
  冠带: "Cap and Gown",
  临官: "Coming of Age",
  帝旺: "Prime",
  衰: "Decline",
  病: "Illness",
  死: "Death",
  墓: "Tomb",
  绝: "Severance",
  胎: "Conception",
  养: "Nurture",
};

/** The strong half of the growth cycle, where the day master is well-rooted. */
const STRONG_STAGES = new Set(["Birth", "Coming of Age", "Prime", "Cap and Gown"]);

const cn = (table: Record<string, string>, raw: string): string => table[raw] ?? raw;

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

    // Element balance across the chart. We tally BOTH the four heavenly stems and
    // the four earthly branches (eight slots total), so the branch layer counts
    // toward the picture rather than only the visible stems. `dominant` is the
    // element you carry most, `weakest` the one you carry least (a quality you may
    // grow into). Ties break by stable generative-cycle order.
    const elementSources = [
      pillars.year.element, pillars.month.element, pillars.day.element, pillars.hour.element,
      BRANCH_ELEMENT[pillars.year.branch] ?? "", BRANCH_ELEMENT[pillars.month.branch] ?? "",
      BRANCH_ELEMENT[pillars.day.branch] ?? "", BRANCH_ELEMENT[pillars.hour.branch] ?? "",
    ];
    const elements = elementCounts(elementSources);
    const dominant = dominantElement(elements);
    const weakest = weakestElement(elements);

    // The Ten Gods (十神): how each other stem relates to the day master. The day
    // pillar's own god is 日主 (the day master itself). These name the working
    // forces in the chart (resource, output, wealth, authority, peer).
    const tenGods = {
      year: cn(TEN_GODS, ec.getYearShiShenGan()),
      month: cn(TEN_GODS, ec.getMonthShiShenGan()),
      day: cn(TEN_GODS, ec.getDayShiShenGan()),
      hour: cn(TEN_GODS, ec.getTimeShiShenGan()),
    };

    // Day-master strength via its growth stage on the day branch (十二长生): where
    // the day stem sits on the vitality cycle, from Birth through Prime to rest.
    const stage = cn(GROWTH_STAGE, ec.getDayDiShi());
    const rooting = STRONG_STAGES.has(stage) ? "strong" : "supported";

    // NaYin (纳音) sound-element of the day pillar: an older, paired-stem reading of
    // the day that names a poetic image and its underlying phase.
    const dayNaYin = ec.getDayNaYin();
    const naYinElement = naYinPhase(dayNaYin);

    // The Useful God (用神), simplified: the element a chart most wants more of.
    // A strong day master is balanced by its weakest supporting element; here we
    // surface the chart's least-present phase as the element to lean toward. This
    // is a schematic reading, not a master's full case-by-case judgement.
    const usefulElement = weakest || dominant;

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
          value: { counts: elements, dominant, weakest },
          display: dominant ? cap(dominant) : "",
        },
        "ten-gods": {
          key: "ten-gods",
          label: "Ten Gods",
          value: tenGods,
          display: `Y:${tenGods.year} · M:${tenGods.month} · H:${tenGods.hour}`,
        },
        strength: {
          key: "strength",
          label: "Day Master Strength",
          value: { stage, rooting },
          display: `${stage} (${rooting})`,
        },
        nayin: {
          key: "nayin",
          label: "Day Pillar NaYin",
          value: { nayin: dayNaYin, element: naYinElement },
          display: naYinElement ? `${cap(naYinElement)} sound` : dayNaYin,
        },
        "useful-element": {
          key: "useful-element",
          label: "Useful Element",
          value: { element: usefulElement },
          display: usefulElement ? cap(usefulElement) : "",
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

/** Lowest-count element, the quality you carry least. Ties break by generative-
 * cycle order so the result is stable across runs. */
function weakestElement(counts: Record<WuXing, number>): string {
  let least = "";
  let leastCount = Infinity;
  for (const el of WU_XING) {
    if (counts[el] < leastCount) {
      least = el;
      leastCount = counts[el];
    }
  }
  return least;
}

/** Map a NaYin (纳音) sound-element name to its five-phase element by its last
 * character, the phase the library encodes (金 metal, 木 wood, ...). */
function naYinPhase(nayin: string): string {
  const ch = nayin.slice(-1);
  const map: Record<string, string> = { 金: "metal", 木: "wood", 水: "water", 火: "fire", 土: "earth" };
  return map[ch] ?? "";
}

function cap(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}
