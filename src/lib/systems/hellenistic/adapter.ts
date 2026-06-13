import type { NativeResult, Primitive, SemanticAdapter } from "@/lib/core/contracts";
import { ONTOLOGY_VERSION } from "@/lib/ontology/version";
import { SIGNS } from "@/lib/core/zodiac";
import { meta } from "./engine";

const RULER_THEME: Record<string, string> = {
  Mars: "leadership",
  Venus: "devotion",
  Mercury: "communication",
  Moon: "nurture",
  Sun: "sovereignty",
  Jupiter: "vision",
  Saturn: "discipline",
};

export const adapter: SemanticAdapter = {
  systemId: meta.id,
  ontologyVersion: ONTOLOGY_VERSION,
  toPrimitives(native: NativeResult): Primitive[] {
    const primitives: Primitive[] = [];

    const ruler = native.factors["chart-ruler"]?.value as string | undefined;
    if (ruler && RULER_THEME[ruler]) {
      primitives.push({
        axis: "theme",
        value: RULER_THEME[ruler],
        weight: 0.6,
        source: meta.id,
        derivedFrom: "ephemeris",
        native: { factorKey: "chart-ruler", raw: ruler },
      });
    }

    const fortune = native.factors.fortune?.value as { signIndex: number } | undefined;
    const sign = fortune && SIGNS[fortune.signIndex];
    if (sign) {
      primitives.push({
        axis: "element",
        value: `western:${sign.element}`,
        weight: 0.4,
        source: meta.id,
        derivedFrom: "ephemeris",
        native: { factorKey: "fortune", raw: fortune },
      });
    }

    return primitives;
  },
};
