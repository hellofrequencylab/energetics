import type { BirthEvent } from "@/lib/core/birth-event";
import type { NativeResult, SystemEngine, SystemMeta } from "@/lib/core/contracts";
import { dateParts } from "@/lib/core/time";
import { gregorianToJDN, longCount, traditional } from "@/lib/maya/core";

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
 * Canonical traditional GMT count (Cholq'ij), per the verified Maya core. The
 * count is a pure, timezone-proof function of the civil birth date. Phase-1
 * minimal output is day-sign + tone; the richer cycles (kin, Haab', Lord of the
 * Night, trecena, Long Count) come for free from the verified engine.
 */
export const engine: SystemEngine = {
  meta,
  compute(birth: BirthEvent): NativeResult {
    const { year, month, day } = dateParts(birth);
    const jdn = gregorianToJDN(year, month, day);
    const t = traditional(jdn);
    const lc = longCount(jdn).toString();

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
        kin: { key: "kin", label: "Tzolk'in Kin", value: t.position, display: `${t.tone} ${t.daySign} · kin ${t.position}` },
        haab: { key: "haab", label: "Haab'", value: { haab: t.haab, month: t.haabMonth, day: t.haabDay }, display: t.haab },
        "lord-of-night": { key: "lord-of-night", label: "Lord of the Night", value: t.lordOfNight, display: `G${t.lordOfNight}` },
        trecena: { key: "trecena", label: "Trecena", value: { trecena: t.trecena, kiche: t.trecenaKiche }, display: `${t.trecena} trecena` },
        "long-count": { key: "long-count", label: "Long Count", value: lc, display: lc },
      },
    };
  },
};
