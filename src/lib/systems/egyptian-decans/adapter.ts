import type { NativeResult, Primitive, SemanticAdapter } from "@/lib/core/contracts";
import { ONTOLOGY_VERSION } from "@/lib/ontology/version";
import { SIGNS } from "@/lib/core/zodiac";
import { meta } from "./engine";
import type { DecanResult } from "./engine";

/** Decan (face) ruler → curated theme. */
const RULER_THEME: Record<string, string> = {
  Mars: "leadership",
  Sun: "sovereignty",
  Venus: "devotion",
  Mercury: "communication",
  Moon: "nurture",
  Saturn: "discipline",
  Jupiter: "vision",
};

export const adapter: SemanticAdapter = {
  systemId: meta.id,
  ontologyVersion: ONTOLOGY_VERSION,
  toPrimitives(native: NativeResult): Primitive[] {
    const primitives: Primitive[] = [];
    const emit = (axis: Primitive["axis"], value: string, weight: number, factorKey: string, raw: unknown) => {
      primitives.push({ axis, value, weight, source: meta.id, derivedFrom: "ephemeris", native: { factorKey, raw } });
    };

    // Sun decan: the headline. Element + polarity from the host sign, plus the
    // face ruler's theme. The strongest voice this system emits.
    const sun = native.factors.decan?.value as DecanResult | undefined;
    if (sun) {
      const sign = SIGNS[sun.signIndex];
      if (sign) {
        emit("element", `western:${sign.element}`, 0.55, "decan", sun);
        emit("polarity", sign.polarity, 0.4, "decan", sun);
      }
      const theme = RULER_THEME[sun.ruler];
      if (theme) emit("theme", theme, 0.5, "decan", sun);
    }

    // Decan triplicity face: the kindred sign that colors the Sun's decan. Its
    // sign theme adds a sub-flavor without re-emitting the same element heavily.
    const face = native.factors["decan-face"]?.value as { faceSignIndex: number } | undefined;
    if (face) {
      const faceSign = SIGNS[face.faceSignIndex];
      if (faceSign) emit("element", `western:${faceSign.element}`, 0.35, "decan-face", face);
    }

    // Moon decan: a softer, inward decan. Element + face ruler theme, lighter.
    const moon = native.factors["moon-decan"]?.value as DecanResult | undefined;
    if (moon) {
      const sign = SIGNS[moon.signIndex];
      if (sign) emit("element", `western:${sign.element}`, 0.35, "moon-decan", moon);
      const theme = RULER_THEME[moon.ruler];
      if (theme) emit("theme", theme, 0.35, "moon-decan", moon);
    }

    // Rising decan (only with time + place): the hour-marker decan on the
    // horizon. Element + face ruler theme, themed toward the self.
    const rising = native.factors["rising-decan"]?.value as DecanResult | undefined;
    if (rising) {
      const sign = SIGNS[rising.signIndex];
      if (sign) {
        emit("element", `western:${sign.element}`, 0.45, "rising-decan", rising);
        emit("polarity", sign.polarity, 0.35, "rising-decan", rising);
      }
      const theme = RULER_THEME[rising.ruler];
      if (theme) emit("theme", theme, 0.4, "rising-decan", rising);
      emit("domain", "self", 0.35, "rising-decan", rising);
    }

    return primitives;
  },
};
