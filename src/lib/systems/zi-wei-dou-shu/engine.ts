import { LunarUtil, Solar } from "lunar-typescript";
import type { BirthEvent } from "@/lib/core/birth-event";
import type { NativeFactor, NativeResult, SystemEngine, SystemMeta } from "@/lib/core/contracts";
import { dateParts, timeParts } from "@/lib/core/time";

export const meta: SystemMeta = {
  id: "zi-wei-dou-shu",
  displayName: "Zi Wei Dou Shu (Purple Star)",
  lineage: "traditional",
  requires: { time: true, place: false },
  derivedFrom: "date",
  dependsOn: [],
  corpusVersion: "1",
};

// 0-based earthly branches (子=0 … 亥=11). LunarUtil.ZHI is 1-indexed.
const ZHI = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const YIN = 2; // 寅 anchors month 1

// Five Tigers (五虎遁): year stem → heavenly stem of the 寅 month.
const FIVE_TIGERS: Record<string, string> = {
  甲: "丙", 己: "丙", 乙: "戊", 庚: "戊", 丙: "庚", 辛: "庚", 丁: "壬", 壬: "壬", 戊: "甲", 癸: "甲",
};
const GAN = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];

const BUREAU_BY_ELEMENT: Record<string, { n: number; name: string }> = {
  水: { n: 2, name: "水二局 (Water 2)" },
  木: { n: 3, name: "木三局 (Wood 3)" },
  金: { n: 4, name: "金四局 (Metal 4)" },
  土: { n: 5, name: "土五局 (Earth 5)" },
  火: { n: 6, name: "火六局 (Fire 6)" },
};

const PALACES = [
  "Life", "Siblings", "Spouse", "Children", "Wealth", "Health",
  "Travel", "Friends", "Career", "Property", "Fortune", "Parents",
];

// 14 major stars: name + branch offset rule (resolved below).
const ZIWEI_SERIES: [string, number][] = [
  ["紫微 Zi Wei", 0], ["天機 Tian Ji", -1], ["太陽 Tai Yang", -3],
  ["武曲 Wu Qu", -4], ["天同 Tian Tong", -5], ["廉貞 Lian Zhen", -8],
];
const TIANFU_SERIES: [string, number][] = [
  ["天府 Tian Fu", 0], ["太陰 Tai Yin", 1], ["貪狼 Tan Lang", 2], ["巨門 Ju Men", 3],
  ["天相 Tian Xiang", 4], ["天梁 Tian Liang", 5], ["七殺 Qi Sha", 6], ["破軍 Po Jun", 10],
];

const mod12 = (n: number) => ((n % 12) + 12) % 12;

/** 紫微 placement from the Five Elements Bureau number + lunar day (classic rule). */
function ziweiBranch(bureau: number, day: number): number {
  const q = Math.ceil(day / bureau);
  const rem = q * bureau - day;
  const base = mod12(YIN + (q - 1));
  return rem % 2 === 0 ? mod12(base + rem) : mod12(base - rem);
}

/**
 * Zi Wei Dou Shu. The lunar basis, Life/Body palaces, and Five Elements Bureau
 * are computed confidently; the 紫微 + 14-major-star placement uses the standard
 * algorithm but is VALIDATION-PENDING (no trusted-calculator check available in
 * this environment) — flagged in the output and kept out of synthesis.
 */
export const engine: SystemEngine = {
  meta,
  compute(birth: BirthEvent): NativeResult {
    const { year, month, day } = dateParts(birth);
    const { hour, minute } = timeParts(birth);
    const lunar = Solar.fromYmdHms(year, month, day, hour, minute, 0).getLunar();

    const lm = Math.abs(lunar.getMonth());
    const ld = lunar.getDay();
    const hourBranch = ZHI.indexOf(lunar.getTimeZhi());
    const yearGan = lunar.getYearGan();

    const monthPalace = mod12(YIN + (lm - 1));
    const ming = mod12(monthPalace - hourBranch);
    const shen = mod12(monthPalace + hourBranch);

    // Five Elements Bureau from the Life Palace ganzhi's NaYin element.
    const baseStem = GAN.indexOf(FIVE_TIGERS[yearGan] ?? "丙");
    const stemIdx = (baseStem + mod12(ming - YIN)) % 10;
    const ganzhi = GAN[stemIdx] + ZHI[ming];
    const nayin = (LunarUtil.NAYIN as Record<string, string>)[ganzhi] ?? "";
    const elementChar = nayin.slice(-1);
    const bureau = BUREAU_BY_ELEMENT[elementChar] ?? { n: 5, name: "土五局 (Earth 5)" };

    // 紫微 + 14 majors (validation-pending).
    const zi = ziweiBranch(bureau.n, ld);
    const tf = mod12(4 - zi);
    const stars: Record<string, number> = {};
    for (const [name, off] of ZIWEI_SERIES) stars[name] = mod12(zi + off);
    for (const [name, off] of TIANFU_SERIES) stars[name] = mod12(tf + off);

    // Palaces laid out from the Life Palace.
    const palaces: Record<string, string> = {};
    for (let i = 0; i < 12; i++) palaces[PALACES[i]] = ZHI[mod12(ming - i)];

    // Stars grouped by palace branch for display.
    const starsByBranch: Record<string, string[]> = {};
    for (const [name, b] of Object.entries(stars)) {
      (starsByBranch[ZHI[b]] ??= []).push(name.split(" ")[0]);
    }

    const factors: Record<string, NativeFactor> = {
      lunar: {
        key: "lunar",
        label: "Lunar Date",
        value: { yearGanZhi: lunar.getYearInGanZhi(), month: lm, day: ld },
        display: `${lunar.getYearInGanZhi()} · month ${lm}, day ${ld}`,
      },
      "life-palace": { key: "life-palace", label: "Life Palace (命宫)", value: ZHI[ming], display: ZHI[ming] },
      "body-palace": { key: "body-palace", label: "Body Palace (身宫)", value: ZHI[shen], display: ZHI[shen] },
      bureau: { key: "bureau", label: "Five Elements Bureau", value: bureau, display: bureau.name },
      "zi-wei": { key: "zi-wei", label: "Zi Wei (紫微) Palace", value: ZHI[zi], display: ZHI[zi] },
      stars: {
        key: "stars",
        label: "Major Stars (by branch)",
        value: { stars, byBranch: starsByBranch },
        display: Object.entries(starsByBranch).map(([b, s]) => `${b}: ${s.join("·")}`).join("  "),
      },
      palaces: { key: "palaces", label: "Palaces", value: palaces, display: PALACES.map((p) => `${p}→${palaces[p]}`).join(", ") },
      note: {
        key: "note",
        label: "Note",
        value: "validation-pending",
        display: "⚠ Lunar basis, palaces & bureau computed; 紫微/14-star placement is standard-algorithm but pending validation against a trusted calculator.",
      },
    };

    return { systemId: meta.id, factors };
  },
};
