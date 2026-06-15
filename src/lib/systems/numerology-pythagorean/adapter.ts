import type { NativeResult, Primitive, SemanticAdapter } from "@/lib/core/contracts";
import { isRegistered } from "@/lib/ontology/axes";
import { ONTOLOGY_VERSION } from "@/lib/ontology/version";
import { meta } from "./engine";

/**
 * Number → curated theme (all registered in ontology THEMES). Defensible readings
 * of the single digits and master numbers: 1 initiates, 2 relates, 3 expresses,
 * 4 builds, 5 ranges, 6 tends, 7 examines, 8 commands, 9 serves, with 11/22/33
 * reading as the higher-octave intuition, vision, and devotion.
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
  11: "intuition",
  22: "vision",
  33: "devotion",
};

/**
 * Number → life domain (all registered in ontology DOMAINS). A second, defensible
 * axis: where each number tends to put its weight in a life. 1 self, 2 relating,
 * 3 creative voice, 4 home and foundations, 5 the wider world, 6 care of others,
 * 7 inner study, 8 work and resources, 9 service to the whole, masters spiritual.
 */
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
  11: "spirituality",
  22: "vocation",
  33: "spirituality",
};

/** Odd numbers read active/initiating, even receptive, masters read active. */
function polarityOf(n: number): "active" | "receptive" {
  return n % 2 === 1 || n >= 11 ? "active" : "receptive";
}

/** Push theme + domain primitives for one single-number factor, if registered. */
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

    const lifePathFactor = native.factors["life-path"];
    if (!lifePathFactor) return primitives;
    const lifePath = lifePathFactor.value as number;

    // Life Path is the headline: full-weight theme + domain + polarity.
    pushNumber(primitives, "life-path", lifePath, 1.0, 0.7);
    primitives.push({
      axis: "polarity",
      value: polarityOf(lifePath),
      weight: 0.6,
      source: meta.id,
      derivedFrom: "date",
      native: { factorKey: "life-path", raw: lifePath },
    });

    // Birthday, Attitude, and Maturity add softer texture on the same axes.
    const birthday = native.factors.birthday?.value as number | undefined;
    if (typeof birthday === "number") pushNumber(primitives, "birthday", birthday, 0.55, 0.4);

    const attitude = native.factors.attitude?.value as number | undefined;
    if (typeof attitude === "number") pushNumber(primitives, "attitude", attitude, 0.45, 0.3);

    const maturity = native.factors.maturity?.value as number | undefined;
    if (typeof maturity === "number") pushNumber(primitives, "maturity", maturity, 0.45, 0.3);

    // The first pinnacle names the theme of the early life stage: a light theme
    // signal so it can converge with date and ephemeris systems without shouting.
    const pinnacles = native.factors.pinnacles?.value as
      | { first: number; second: number; third: number; fourth: number }
      | undefined;
    if (pinnacles) {
      pushNumber(primitives, "pinnacles", pinnacles.first, 0.4, 0);
    }

    return primitives;
  },
};
