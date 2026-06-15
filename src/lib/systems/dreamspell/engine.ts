import type { BirthEvent } from "@/lib/core/birth-event";
import type { NativeResult, SystemEngine, SystemMeta } from "@/lib/core/contracts";
import { dateParts } from "@/lib/core/time";
import { dreamspell } from "@/lib/maya/core";

export const meta: SystemMeta = {
  id: "dreamspell",
  displayName: "Dreamspell (Argüelles)",
  lineage: "modern-reconstruction",
  requires: { time: false, place: false },
  derivedFrom: "date",
  dependsOn: [],
  corpusVersion: "1",
};

/**
 * The four color families and their cardinal directions in the Dreamspell, in
 * the canonical rotation Red, White, Blue, Yellow. Each family carries an action
 * verb that names how its seals tend to move. Original plain phrasing, derived
 * purely from the color, no reproduced source text.
 */
const FAMILY: Record<string, { direction: string; verb: string }> = {
  Red: { direction: "East", verb: "initiates" },
  White: { direction: "North", verb: "refines" },
  Blue: { direction: "West", verb: "transforms" },
  Yellow: { direction: "South", verb: "ripens" },
};

/**
 * The thirteen galactic tones each name a step in a wavespell, a function rather
 * than only a number. Our own short labels for that arc, from the first pulse of
 * purpose through the questioning, gathering, and balancing middle to the final
 * release and return. No copyrighted phrasing.
 */
const TONE_FUNCTION = [
  "purpose", // 1 Magnetic
  "challenge", // 2 Lunar
  "service", // 3 Electric
  "form", // 4 Self-Existing
  "radiance", // 5 Overtone
  "balance", // 6 Rhythmic
  "attunement", // 7 Resonant
  "integrity", // 8 Galactic
  "intention", // 9 Solar
  "manifestation", // 10 Planetary
  "release", // 11 Spectral
  "cooperation", // 12 Crystal
  "presence", // 13 Cosmic
] as const;

/**
 * Dreamspell — a MODERN (1987) reconstruction with a leap-day-skipping
 * correlation; NOT the calendar Maya daykeepers keep. Computed for display via
 * the verified core, and deepened here with native Dreamspell structure (color
 * direction, tone function, wavespell, oracle) all derived purely from the date.
 * Its adapter primitives are shown for the per-system card but are excluded from
 * structural synthesis by the catalog (never conflated with the living tradition).
 */
export const engine: SystemEngine = {
  meta,
  compute(birth: BirthEvent): NativeResult {
    const { year, month, day } = dateParts(birth);
    const ds = dreamspell(year, month, day);

    if (ds.kin === 0) {
      return {
        systemId: meta.id,
        factors: {
          signature: { key: "signature", label: "Galactic Signature", value: ds.signature, display: ds.signature },
        },
      };
    }

    const toneIdx = (ds.kin - 1) % 13; // 0..12
    const family = ds.color ? FAMILY[ds.color] : undefined;

    // The wavespell: the thirteen-day cycle this kin belongs to, opened by a
    // Magnetic (tone 1) kin. There are twenty wavespells in the 260-kin count.
    // The opening kin is this kin stepped back to its tone-1 start.
    const wavespellStartKin = ((ds.kin - 1 - toneIdx) % 260 + 260) % 260 + 1;
    const wavespellNumber = Math.floor((wavespellStartKin - 1) / 13) + 1; // 1..20

    return {
      systemId: meta.id,
      factors: {
        signature: { key: "signature", label: "Galactic Signature", value: ds.signature, display: ds.signature },
        kin: { key: "kin", label: "Kin", value: ds.kin, display: `Kin ${ds.kin}` },
        color: { key: "color", label: "Color Family", value: ds.color, display: ds.color },
        seal: { key: "seal", label: "Solar Seal", value: ds.seal, display: `${ds.color} ${ds.seal}` },
        direction: {
          key: "direction",
          label: "Direction and Action",
          value: family
            ? { direction: family.direction, verb: family.verb, color: ds.color }
            : { direction: undefined, verb: undefined, color: ds.color },
          display: family ? `${family.direction} · ${ds.color} ${family.verb}` : ds.color,
        },
        tone: { key: "tone", label: "Galactic Tone", value: ds.tone, display: `${ds.tone} ${ds.toneName}` },
        "tone-function": {
          key: "tone-function",
          label: "Tone Function",
          value: TONE_FUNCTION[toneIdx],
          display: `${ds.toneName}: ${TONE_FUNCTION[toneIdx]}`,
        },
        wavespell: {
          key: "wavespell",
          label: "Wavespell",
          value: { number: wavespellNumber, startKin: wavespellStartKin },
          display: `Wavespell ${wavespellNumber} (opens at kin ${wavespellStartKin})`,
        },
        oracle: {
          key: "oracle",
          label: "Fifth-Force Oracle",
          value: ds.oracle,
          display: ds.oracle
            ? `guide ${ds.oracle.guide} · analog ${ds.oracle.analog} · antipode ${ds.oracle.antipode} · occult ${ds.oracle.occult}`
            : undefined,
        },
      },
    };
  },
};
