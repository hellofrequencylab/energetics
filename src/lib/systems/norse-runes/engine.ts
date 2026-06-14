import type { BirthEvent } from "@/lib/core/birth-event";
import type { NativeResult, SystemEngine, SystemMeta } from "@/lib/core/contracts";
import { dateParts } from "@/lib/core/time";

export const meta: SystemMeta = {
  id: "norse-runes",
  displayName: "Norse Birth Runes",
  lineage: "modern-reconstruction",
  requires: { time: false, place: false },
  derivedFrom: "date",
  dependsOn: [],
  corpusVersion: "1",
};

// Elder Futhark "rune calendar" — a modern (~half-month) mapping. [startMD,endMD]
// as month*100+day; Eihwaz wraps the year boundary. Rune names are historical;
// keywords are our own brief, plain-language gloss.
const RUNES: { rune: string; start: number; end: number; keyword: string }[] = [
  { rune: "Fehu", start: 629, end: 714, keyword: "wealth, new ventures" },
  { rune: "Uruz", start: 715, end: 729, keyword: "strength, vitality" },
  { rune: "Thurisaz", start: 730, end: 813, keyword: "catalyst, defense" },
  { rune: "Ansuz", start: 814, end: 829, keyword: "communication, insight" },
  { rune: "Raidho", start: 830, end: 913, keyword: "journey, rhythm" },
  { rune: "Kenaz", start: 914, end: 928, keyword: "vision, craft" },
  { rune: "Gebo", start: 929, end: 1013, keyword: "gift, exchange" },
  { rune: "Wunjo", start: 1014, end: 1028, keyword: "joy, harmony" },
  { rune: "Hagalaz", start: 1029, end: 1113, keyword: "disruption, change" },
  { rune: "Nauthiz", start: 1114, end: 1128, keyword: "need, resilience" },
  { rune: "Isa", start: 1129, end: 1213, keyword: "stillness, focus" },
  { rune: "Jera", start: 1214, end: 1228, keyword: "harvest, cycles" },
  { rune: "Eihwaz", start: 1229, end: 113, keyword: "endurance, the axis" },
  { rune: "Perthro", start: 114, end: 128, keyword: "mystery, chance" },
  { rune: "Algiz", start: 129, end: 212, keyword: "protection, connection" },
  { rune: "Sowilo", start: 213, end: 227, keyword: "success, the sun" },
  { rune: "Tiwaz", start: 228, end: 314, keyword: "honor, resolve" },
  { rune: "Berkano", start: 315, end: 330, keyword: "growth, renewal" },
  { rune: "Ehwaz", start: 331, end: 414, keyword: "partnership, movement" },
  { rune: "Mannaz", start: 415, end: 430, keyword: "the self, community" },
  { rune: "Laguz", start: 501, end: 515, keyword: "flow, intuition" },
  { rune: "Ingwaz", start: 516, end: 530, keyword: "fertility, potential" },
  { rune: "Dagaz", start: 531, end: 614, keyword: "breakthrough, dawn" },
  { rune: "Othala", start: 615, end: 628, keyword: "heritage, home" },
];

export const engine: SystemEngine = {
  meta,
  compute(birth: BirthEvent): NativeResult {
    const { month, day } = dateParts(birth);
    const md = month * 100 + day;
    const r =
      RUNES.find((x) => (x.start <= x.end ? md >= x.start && md <= x.end : md >= x.start || md <= x.end)) ?? RUNES[0];

    return {
      systemId: meta.id,
      factors: {
        rune: { key: "rune", label: "Birth Rune", value: { rune: r.rune, keyword: r.keyword }, display: `${r.rune}: ${r.keyword}` },
      },
    };
  },
};
