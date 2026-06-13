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
    const factor = native.factors.decan;
    if (!factor) return [];
    const d = factor.value as DecanResult;
    const sign = SIGNS[d.signIndex];
    const base = { source: meta.id, derivedFrom: "ephemeris" as const, native: { factorKey: "decan", raw: d } };
    const primitives: Primitive[] = [];

    if (sign) primitives.push({ axis: "element", value: `western:${sign.element}`, weight: 0.4, ...base });
    const theme = RULER_THEME[d.ruler];
    if (theme) primitives.push({ axis: "theme", value: theme, weight: 0.4, ...base });

    return primitives;
  },
};
