import type { NativeResult, Primitive, SemanticAdapter } from "@/lib/core/contracts";
import { isRegistered } from "@/lib/ontology/axes";
import { ONTOLOGY_VERSION } from "@/lib/ontology/version";
import { meta } from "./engine";

/** Chaldean number → curated theme (each value is registered in ontology THEMES). */
const NUMBER_THEME: Record<number, string> = {
  1: "leadership",
  2: "sensitivity",
  3: "communication",
  4: "structure",
  5: "exploration",
  6: "nurture",
  7: "intuition",
  8: "sovereignty",
  9: "transformation",
};

/**
 * Chaldean number → life domain (each registered in ontology DOMAINS). Where the
 * tone of the name tends to land: 1 self, 2 relating, 3 creative voice, 4 home and
 * foundations, 5 the wider world, 6 care, 7 inner life, 8 work and resources, 9
 * the shared whole.
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
};

/** Add theme (and optional domain) primitives for one numerology factor. */
function pushNumber(
  primitives: Primitive[],
  native: NativeResult,
  factorKey: string,
  themeWeight: number,
  domainWeight: number,
): void {
  const factor = native.factors[factorKey];
  if (!factor) return;
  const n = factor.value as number;
  const base = { source: meta.id, derivedFrom: "name" as const, native: { factorKey, raw: n } };
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
    const factor = native.factors["name-number"];
    if (!factor) return [];
    const n = factor.value as number;
    const primitives: Primitive[] = [];

    // Name number carries the loudest theme + domain, then the soul urge (vowels)
    // and the personality (consonants) speak a touch more softly. The hidden
    // passion adds a quiet underlying drive, the cornerstone how you begin.
    pushNumber(primitives, native, "name-number", 0.7, 0.6);
    pushNumber(primitives, native, "soul-urge", 0.5, 0.4);
    pushNumber(primitives, native, "personality", 0.5, 0.3);
    pushNumber(primitives, native, "hidden-passion", 0.45, 0);
    pushNumber(primitives, native, "cornerstone", 0.35, 0);

    primitives.push({
      axis: "polarity",
      value: n % 2 === 1 ? "active" : "receptive",
      weight: 0.5,
      source: meta.id,
      derivedFrom: "name",
      native: { factorKey: "name-number", raw: n },
    });

    return primitives;
  },
};
