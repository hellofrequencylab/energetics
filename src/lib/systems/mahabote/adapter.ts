import type { NativeResult, Primitive, SemanticAdapter } from "@/lib/core/contracts";
import { ONTOLOGY_VERSION } from "@/lib/ontology/version";
import { meta } from "./engine";

const PLANET_THEME: Record<string, string> = {
  Sun: "sovereignty",
  Moon: "nurture",
  Mars: "leadership",
  Mercury: "communication",
  Jupiter: "vision",
  Venus: "devotion",
  Saturn: "discipline",
};

export const adapter: SemanticAdapter = {
  systemId: meta.id,
  ontologyVersion: ONTOLOGY_VERSION,
  toPrimitives(native: NativeResult): Primitive[] {
    const factor = native.factors.sign;
    if (!factor) return [];
    const { planet } = factor.value as { planet: string };
    const theme = PLANET_THEME[planet];
    if (!theme) return [];
    return [
      {
        axis: "theme",
        value: theme,
        weight: 0.4,
        source: meta.id,
        derivedFrom: "date",
        native: { factorKey: "sign", raw: planet },
      },
    ];
  },
};
