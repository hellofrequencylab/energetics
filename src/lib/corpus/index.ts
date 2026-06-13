/**
 * Corpus lookup: turn a system's computed factors into quick-guide
 * interpretation lines for the UI. Reads ONLY the corpus + native results.
 */
import type { NativeResult } from "@/lib/core/contracts";
import {
  ARCANA_GUIDE,
  DAYSIGN_GUIDE,
  NUMBER_GUIDE,
  PLANET_GUIDE,
  SIGN_GUIDE,
  TONE_GUIDE,
} from "./data";

export interface Interpretation {
  label: string;
  text: string;
}

export type CorpusKind = "sign" | "planet" | "number" | "daysign" | "tone" | "arcana";

/** Single quick-guide lookup (also backs GET /api/interpretations/:kind/:key). */
export function lookup(kind: CorpusKind, key: string): string | undefined {
  switch (kind) {
    case "sign":
      return SIGN_GUIDE[key];
    case "planet":
      return PLANET_GUIDE[key];
    case "number":
      return NUMBER_GUIDE[Number(key)];
    case "daysign":
      return DAYSIGN_GUIDE[key];
    case "tone":
      return TONE_GUIDE[Number(key)];
    case "arcana":
      return ARCANA_GUIDE[Number(key)];
  }
}

const WESTERN_BODIES = [
  "sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn",
  "uranus", "neptune", "pluto", "northNode", "southNode", "chiron",
];

/** Quick-guide lines for a computed system, keyed by its known factor shapes. */
export function interpretationsFor(systemId: string, native: NativeResult): Interpretation[] {
  const out: Interpretation[] = [];
  const f = native.factors;

  switch (systemId) {
    case "western-tropical": {
      for (const body of WESTERN_BODIES) {
        const factor = f[body];
        if (!factor) continue;
        const sign = (factor.value as { sign?: string }).sign;
        const planet = PLANET_GUIDE[body];
        if (planet && sign && SIGN_GUIDE[sign]) {
          out.push({ label: `${factor.label} in ${sign}`, text: `${planet} ${SIGN_GUIDE[sign]}` });
        }
      }
      break;
    }
    case "vedic-jyotish": {
      for (const key of ["lagna", "moon", "sun"]) {
        const factor = f[key];
        const rasi = factor && (factor.value as { rasi?: string }).rasi;
        if (rasi && SIGN_GUIDE[rasi]) out.push({ label: `${factor!.label} · ${rasi}`, text: SIGN_GUIDE[rasi] });
      }
      break;
    }
    case "numerology-pythagorean": {
      const n = f["life-path"]?.value as number | undefined;
      if (n != null && NUMBER_GUIDE[n]) out.push({ label: `Life Path ${n}`, text: NUMBER_GUIDE[n] });
      break;
    }
    case "numerology-chaldean": {
      const n = f["name-number"]?.value as number | undefined;
      if (n != null && NUMBER_GUIDE[n]) out.push({ label: `Name Number ${n}`, text: NUMBER_GUIDE[n] });
      break;
    }
    case "tzolkin": {
      const ds = (f["day-sign"]?.value as { daySign?: string })?.daySign;
      if (ds && DAYSIGN_GUIDE[ds]) out.push({ label: `Day Sign · ${ds}`, text: DAYSIGN_GUIDE[ds] });
      const tone = f.tone?.value as number | undefined;
      if (tone != null && TONE_GUIDE[tone]) out.push({ label: `Tone ${tone}`, text: TONE_GUIDE[tone] });
      break;
    }
    case "tarot-birth-cards": {
      for (const key of ["personality", "soul"]) {
        const v = f[key]?.value as { card?: string; number?: number } | undefined;
        if (v?.number != null && ARCANA_GUIDE[v.number]) {
          out.push({ label: `${f[key]!.label}`, text: ARCANA_GUIDE[v.number] });
        }
      }
      break;
    }
  }
  return out;
}
