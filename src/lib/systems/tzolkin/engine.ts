import type { BirthEvent } from "@/lib/core/birth-event";
import type { NativeResult, SystemEngine, SystemMeta } from "@/lib/core/contracts";
import { dateParts } from "@/lib/core/time";
import {
  DAY_SIGNS,
  gregorianToJDN,
  KICHE,
  longCount,
  traditional,
} from "@/lib/maya/core";

export const meta: SystemMeta = {
  id: "tzolkin",
  displayName: "Mayan Tzolk'in (Cholq'ij)",
  lineage: "traditional",
  requires: { time: false, place: false },
  derivedFrom: "date",
  dependsOn: [],
  corpusVersion: "1",
};

/**
 * The four directions the twenty nawales rotate through, in the canonical Maya
 * order East, North, West, South. The day signs step through them one by one, so
 * each sign carries a direction and its paired color and quality. This is native
 * Maya cosmology, derived purely from the sign index, not borrowed from any
 * modern correlation.
 */
const DIRECTIONS = [
  { direction: "East", color: "Red", quality: "the rising and beginnings" },
  { direction: "North", color: "White", quality: "the ancestors and clarity" },
  { direction: "West", color: "Blue", quality: "the setting and transformation" },
  { direction: "South", color: "Yellow", quality: "the harvest and the body" },
] as const;

/** Plain-language arc of the thirteen tones, named softly for the reader. */
function tonePhase(tone: number): string {
  if (tone <= 4) return "rising"; // 1-4: the spark sets out and takes form
  if (tone <= 9) return "building"; // 5-9: gathering, command, and balance
  return "releasing"; // 10-13: refining, releasing, and giving back
}

/**
 * Canonical traditional GMT count (Cholq'ij), per the verified Maya core. The
 * count is a pure, timezone-proof function of the civil birth date. The day sign
 * and tone are the loudest voices; the richer cycles (kin, Haab', Lord of the
 * Night, trecena, direction, year bearer, Long Count) come for free from the
 * verified engine and from native structure derived purely from the date.
 */
export const engine: SystemEngine = {
  meta,
  compute(birth: BirthEvent): NativeResult {
    const { year, month, day } = dateParts(birth);
    const jdn = gregorianToJDN(year, month, day);
    const t = traditional(jdn);
    const lc = longCount(jdn).toString();

    // Direction and color of the day sign, native to the twenty-sign rotation.
    const dir = DIRECTIONS[t.signIndex % 4];

    // The Year Bearer (the Mam, cargador del año): the day sign sitting on the
    // most recent Haab' New Year (0 Pop), which carries the whole solar year.
    // Days since 0 Pop is the Haab' position; the sign cycles every twenty days.
    const bearerIndex = ((t.signIndex - (t.haabMonth * 20 + t.haabDay)) % 20 + 20) % 20;

    // Wayeb' is the five-day nameless month that closes the Haab' year, a liminal
    // resting time. Haab' months 0..17 are the named twenty-day winals; month 18
    // is Wayeb'.
    const inWayeb = t.haabMonth === 18;

    return {
      systemId: meta.id,
      factors: {
        "day-sign": {
          key: "day-sign",
          label: "Day Sign (Nawal)",
          value: { daySign: t.daySign, kiche: t.kiche, signIndex: t.signIndex },
          display: `${t.daySign} / ${t.kiche}`,
        },
        tone: { key: "tone", label: "Tone", value: t.tone, display: String(t.tone) },
        "tone-phase": {
          key: "tone-phase",
          label: "Tone Phase",
          value: tonePhase(t.tone),
          display: `${tonePhase(t.tone)} (tone ${t.tone})`,
        },
        direction: {
          key: "direction",
          label: "Direction and Color",
          value: { direction: dir.direction, color: dir.color, quality: dir.quality },
          display: `${dir.direction} · ${dir.color}`,
        },
        kin: { key: "kin", label: "Tzolk'in Kin", value: t.position, display: `${t.tone} ${t.daySign} · kin ${t.position}` },
        haab: { key: "haab", label: "Haab'", value: { haab: t.haab, month: t.haabMonth, day: t.haabDay }, display: t.haab },
        wayeb: {
          key: "wayeb",
          label: "Wayeb' (liminal days)",
          value: inWayeb,
          display: inWayeb ? "Born in Wayeb'" : "Outside Wayeb'",
        },
        "year-bearer": {
          key: "year-bearer",
          label: "Year Bearer (Mam)",
          value: { daySign: DAY_SIGNS[bearerIndex], kiche: KICHE[bearerIndex], signIndex: bearerIndex },
          display: `${DAY_SIGNS[bearerIndex]} / ${KICHE[bearerIndex]}`,
        },
        "lord-of-night": { key: "lord-of-night", label: "Lord of the Night", value: t.lordOfNight, display: `G${t.lordOfNight}` },
        trecena: { key: "trecena", label: "Trecena", value: { trecena: t.trecena, kiche: t.trecenaKiche }, display: `${t.trecena} trecena` },
        "long-count": { key: "long-count", label: "Long Count", value: lc, display: lc },
      },
    };
  },
};
