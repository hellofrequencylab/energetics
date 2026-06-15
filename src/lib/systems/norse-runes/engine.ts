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
  corpusVersion: "2",
};

type RuneElement = "fire" | "earth" | "air" | "water";
type RunePolarity = "active" | "receptive" | "balanced";

// Elder Futhark "rune calendar" — a modern (~half-month) mapping. [startMD,endMD]
// as month*100+day; Eihwaz wraps the year boundary. Rune names are historical;
// keywords are our own brief, plain-language gloss.
//
// The futhark order also fixes each rune's aett (its family of eight) and, where
// the lore genuinely leans that way, a classical element and an active/receptive
// polarity. Elements and polarities are our own reading of each rune's meaning,
// not a single canonical source, so they take part in the synthesis at a modest
// weight that respects the reconstruction lineage.
const RUNES: {
  rune: string;
  start: number;
  end: number;
  keyword: string;
  element: RuneElement;
  polarity: RunePolarity;
}[] = [
  // Freyr's aett (the first eight): making, growth, exchange.
  { rune: "Fehu", start: 629, end: 714, keyword: "wealth, new ventures", element: "fire", polarity: "active" },
  { rune: "Uruz", start: 715, end: 729, keyword: "strength, vitality", element: "earth", polarity: "active" },
  { rune: "Thurisaz", start: 730, end: 813, keyword: "catalyst, defense", element: "fire", polarity: "active" },
  { rune: "Ansuz", start: 814, end: 829, keyword: "communication, insight", element: "air", polarity: "active" },
  { rune: "Raidho", start: 830, end: 913, keyword: "journey, rhythm", element: "air", polarity: "active" },
  { rune: "Kenaz", start: 914, end: 928, keyword: "vision, craft", element: "fire", polarity: "active" },
  { rune: "Gebo", start: 929, end: 1013, keyword: "gift, exchange", element: "air", polarity: "receptive" },
  { rune: "Wunjo", start: 1014, end: 1028, keyword: "joy, harmony", element: "air", polarity: "receptive" },
  // Hagal's aett (the second eight): trial, necessity, turning.
  { rune: "Hagalaz", start: 1029, end: 1113, keyword: "disruption, change", element: "water", polarity: "receptive" },
  { rune: "Nauthiz", start: 1114, end: 1128, keyword: "need, resilience", element: "fire", polarity: "receptive" },
  { rune: "Isa", start: 1129, end: 1213, keyword: "stillness, focus", element: "water", polarity: "receptive" },
  { rune: "Jera", start: 1214, end: 1228, keyword: "harvest, cycles", element: "earth", polarity: "balanced" },
  { rune: "Eihwaz", start: 1229, end: 113, keyword: "endurance, the axis", element: "earth", polarity: "active" },
  { rune: "Perthro", start: 114, end: 128, keyword: "mystery, chance", element: "water", polarity: "receptive" },
  { rune: "Algiz", start: 129, end: 212, keyword: "protection, connection", element: "air", polarity: "receptive" },
  { rune: "Sowilo", start: 213, end: 227, keyword: "success, the sun", element: "fire", polarity: "active" },
  // Tyr's aett (the third eight): order, bond, inheritance.
  { rune: "Tiwaz", start: 228, end: 314, keyword: "honor, resolve", element: "air", polarity: "active" },
  { rune: "Berkano", start: 315, end: 330, keyword: "growth, renewal", element: "earth", polarity: "receptive" },
  { rune: "Ehwaz", start: 331, end: 414, keyword: "partnership, movement", element: "earth", polarity: "active" },
  { rune: "Mannaz", start: 415, end: 430, keyword: "the self, community", element: "air", polarity: "balanced" },
  { rune: "Laguz", start: 501, end: 515, keyword: "flow, intuition", element: "water", polarity: "receptive" },
  { rune: "Ingwaz", start: 516, end: 530, keyword: "fertility, potential", element: "earth", polarity: "receptive" },
  { rune: "Dagaz", start: 531, end: 614, keyword: "breakthrough, dawn", element: "fire", polarity: "active" },
  { rune: "Othala", start: 615, end: 628, keyword: "heritage, home", element: "earth", polarity: "receptive" },
];

/** The three aettir (families of eight) in futhark order. */
const AETTIR = [
  { aett: "Freyr's aett", theme: "making, growth, exchange" },
  { aett: "Hagal's aett", theme: "trial, necessity, turning" },
  { aett: "Tyr's aett", theme: "order, bond, inheritance" },
];

export const engine: SystemEngine = {
  meta,
  compute(birth: BirthEvent): NativeResult {
    const { month, day } = dateParts(birth);
    const md = month * 100 + day;
    const idx = RUNES.findIndex((x) =>
      x.start <= x.end ? md >= x.start && md <= x.end : md >= x.start || md <= x.end,
    );
    const i = idx >= 0 ? idx : 0;
    const r = RUNES[i];

    // The rune's place in the 24-rune futhark fixes its aett (8 runes each) and
    // its position within that aett (1..8). Both are pure reads of the index.
    const aettIndex = Math.floor(i / 8);
    const aett = AETTIR[aettIndex];
    const seatInAett = (i % 8) + 1;

    return {
      systemId: meta.id,
      factors: {
        rune: {
          key: "rune",
          label: "Birth Rune",
          value: { rune: r.rune, keyword: r.keyword, element: r.element, polarity: r.polarity },
          display: `${r.rune}: ${r.keyword}`,
        },
        aett: {
          key: "aett",
          label: "Aett",
          value: { aett: aett.aett, theme: aett.theme, seat: seatInAett },
          display: `${aett.aett}, seat ${seatInAett} of 8`,
        },
        element: {
          key: "element",
          label: "Element",
          value: r.element,
          display: r.element.charAt(0).toUpperCase() + r.element.slice(1),
        },
        polarity: {
          key: "polarity",
          label: "Polarity",
          value: r.polarity,
          display:
            r.polarity === "active"
              ? "Active, driving"
              : r.polarity === "receptive"
                ? "Receptive, holding"
                : "Balanced",
        },
      },
    };
  },
};
