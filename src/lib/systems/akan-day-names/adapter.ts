import type { NativeResult, Primitive, SemanticAdapter } from "@/lib/core/contracts";
import { ONTOLOGY_VERSION } from "@/lib/ontology/version";
import { meta } from "./engine";

/** Birth weekday → curated theme (the day's traditional character). */
const DAY_THEME: Record<string, string> = {
  Sunday: "leadership",
  Monday: "nurture",
  Tuesday: "sensitivity",
  Wednesday: "communication",
  Thursday: "discipline",
  Friday: "exploration",
  Saturday: "vision",
};

export const adapter: SemanticAdapter = {
  systemId: meta.id,
  ontologyVersion: ONTOLOGY_VERSION,
  toPrimitives(native: NativeResult): Primitive[] {
    const factor = native.factors["day-name"];
    if (!factor) return [];
    const { day } = factor.value as { day: string };
    const theme = DAY_THEME[day];
    if (!theme) return [];
    return [
      {
        axis: "theme",
        value: theme,
        weight: 0.5,
        source: meta.id,
        derivedFrom: "date",
        native: { factorKey: "day-name", raw: day },
      },
    ];
  },
};
