import type { NativeResult, Primitive, SemanticAdapter } from "@/lib/core/contracts";
import { isRegistered } from "@/lib/ontology/axes";
import { ONTOLOGY_VERSION } from "@/lib/ontology/version";
import { meta } from "./engine";

/**
 * Lo Shu cell number → curated theme (each registered in ontology THEMES). The
 * single digits read the same way they do across numerology: 1 initiates, 2
 * relates, 3 expresses, 4 builds, 5 ranges, 6 tends, 7 examines, 8 commands, 9
 * serves.
 */
const NUMBER_THEME: Record<number, string> = {
  1: "leadership",
  2: "sensitivity",
  3: "communication",
  4: "structure",
  5: "exploration",
  6: "nurture",
  7: "analysis",
  8: "sovereignty",
  9: "service",
};

/** Lo Shu cell number → life domain (each registered in ontology DOMAINS). */
const NUMBER_DOMAIN: Record<number, string> = {
  1: "self",
  2: "relationship",
  3: "creativity",
  4: "home",
  5: "philosophy",
  6: "service-health",
  7: "spirituality",
  8: "vocation",
  9: "community",
};

/**
 * Each complete magic-square line → a defensible theme registered in THEMES. The
 * three planes (mind, heart, action) and three pillars (plan, will, doing) plus
 * the two diagonals (self-direction, sensitivity) map to readings we can stand by.
 */
const LINE_THEME: Record<string, string> = {
  "row-top": "vision",
  "row-middle": "sensitivity",
  "row-bottom": "structure",
  "col-left": "analysis",
  "col-middle": "discipline",
  "col-right": "leadership",
  "diag-down": "sovereignty",
  "diag-up": "nurture",
};

function pushNumber(
  primitives: Primitive[],
  factorKey: string,
  n: number,
  themeWeight: number,
  domainWeight: number,
): void {
  const base = { source: meta.id, derivedFrom: "date" as const, native: { factorKey, raw: n } };
  const theme = NUMBER_THEME[n];
  if (theme && isRegistered("theme", theme)) {
    primitives.push({ axis: "theme", value: theme, weight: themeWeight, ...base });
  }
  const domain = NUMBER_DOMAIN[n];
  if (domain && isRegistered("domain", domain) && domainWeight > 0) {
    primitives.push({ axis: "domain", value: domain, weight: domainWeight, ...base });
  }
}

export const adapter: SemanticAdapter = {
  systemId: meta.id,
  ontologyVersion: ONTOLOGY_VERSION,
  toPrimitives(native: NativeResult): Primitive[] {
    const primitives: Primitive[] = [];

    // Strongest cell: the natural strength the date leans on, the loudest signal.
    const strongest = native.factors.strongest?.value as number | undefined;
    if (typeof strongest === "number" && strongest >= 1) {
      pushNumber(primitives, "strongest", strongest, 0.8, 0.6);
      primitives.push({
        axis: "polarity",
        value: strongest % 2 === 1 ? "active" : "receptive",
        weight: 0.5,
        source: meta.id,
        derivedFrom: "date",
        native: { factorKey: "strongest", raw: strongest },
      });
    }

    // Conductor and driver: the two single-digit summary numbers of the date.
    const conductor = native.factors.conductor?.value as number | undefined;
    if (typeof conductor === "number") pushNumber(primitives, "conductor", conductor, 0.7, 0.5);

    const driver = native.factors.driver?.value as number | undefined;
    if (typeof driver === "number") pushNumber(primitives, "driver", driver, 0.5, 0.3);

    // Complete arrows: filled magic-square lines, each a defensible theme. Lighter
    // weight since several can be present at once.
    const completeArrows = native.factors["complete-arrows"]?.value as
      | { key: string }[]
      | undefined;
    if (completeArrows) {
      for (const arrow of completeArrows) {
        const theme = LINE_THEME[arrow.key];
        if (theme && isRegistered("theme", theme)) {
          primitives.push({
            axis: "theme",
            value: theme,
            weight: 0.35,
            source: meta.id,
            derivedFrom: "date",
            native: { factorKey: "complete-arrows", raw: arrow.key },
          });
        }
      }
    }

    return primitives;
  },
};
