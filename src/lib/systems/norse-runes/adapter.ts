import type { NativeResult, Primitive, SemanticAdapter } from "@/lib/core/contracts";
import { elementTerm, isRegistered } from "@/lib/ontology/axes";
import { ONTOLOGY_VERSION } from "@/lib/ontology/version";
import { meta } from "./engine";

/**
 * Birth rune to ontology themes (registered in THEMES). The mapping is our own
 * plain reading of each rune's keyword, so the rune calendar takes part in the
 * synthesis as a date-derived voice. Lineage stays labeled: this is a modern
 * reconstruction, so it carries a modest weight.
 */
const RUNE_THEME: Record<string, string[]> = {
  Fehu: ["exploration", "structure"],
  Uruz: ["sovereignty"],
  Thurisaz: ["transformation"],
  Ansuz: ["communication"],
  Raidho: ["exploration"],
  Kenaz: ["vision"],
  Gebo: ["devotion"],
  Wunjo: ["play"],
  Hagalaz: ["transformation"],
  Nauthiz: ["discipline"],
  Isa: ["discipline"],
  Jera: ["structure"],
  Eihwaz: ["discipline"],
  Perthro: ["intuition"],
  Algiz: ["nurture"],
  Sowilo: ["leadership"],
  Tiwaz: ["sovereignty"],
  Berkano: ["nurture"],
  Ehwaz: ["devotion"],
  Mannaz: ["service"],
  Laguz: ["intuition"],
  Ingwaz: ["nurture"],
  Dagaz: ["transformation"],
  Othala: ["nurture"],
};

/** Birth rune to the life area it most naturally lands in (registered DOMAINS). */
const RUNE_DOMAIN: Record<string, string> = {
  Fehu: "resources",
  Uruz: "self",
  Thurisaz: "transformation",
  Ansuz: "communication",
  Raidho: "philosophy",
  Kenaz: "creativity",
  Gebo: "relationship",
  Wunjo: "community",
  Hagalaz: "transformation",
  Nauthiz: "service-health",
  Isa: "self",
  Jera: "vocation",
  Eihwaz: "spirituality",
  Perthro: "spirituality",
  Algiz: "service-health",
  Sowilo: "vocation",
  Tiwaz: "vocation",
  Berkano: "home",
  Ehwaz: "relationship",
  Mannaz: "community",
  Laguz: "spirituality",
  Ingwaz: "home",
  Dagaz: "transformation",
  Othala: "home",
};

/** The aett's broad theme, emitted at a light weight as the rune's family signal. */
const AETT_THEME: Record<string, string> = {
  "Freyr's aett": "nurture", // making, growth, exchange
  "Hagal's aett": "transformation", // trial, necessity, turning
  "Tyr's aett": "structure", // order, bond, inheritance
};

export const adapter: SemanticAdapter = {
  systemId: meta.id,
  ontologyVersion: ONTOLOGY_VERSION,
  toPrimitives(native: NativeResult): Primitive[] {
    const runeValue = native.factors.rune?.value as
      | { rune?: string; element?: string; polarity?: string }
      | undefined;
    const rune = runeValue?.rune;
    if (!rune) return [];

    const primitives: Primitive[] = [];
    const base = {
      source: meta.id,
      derivedFrom: "date" as const,
      native: { factorKey: "rune", raw: rune },
    };

    for (const value of RUNE_THEME[rune] ?? []) {
      if (isRegistered("theme", value)) {
        primitives.push({ axis: "theme", value, weight: 0.45, ...base });
      }
    }

    const domain = RUNE_DOMAIN[rune];
    if (domain && isRegistered("domain", domain)) {
      primitives.push({ axis: "domain", value: domain, weight: 0.35, ...base });
    }

    if (runeValue?.element) {
      const value = elementTerm("western", runeValue.element);
      if (isRegistered("element", value)) {
        primitives.push({ axis: "element", value, weight: 0.4, ...base });
      }
    }

    if (runeValue?.polarity && isRegistered("polarity", runeValue.polarity)) {
      primitives.push({ axis: "polarity", value: runeValue.polarity, weight: 0.4, ...base });
    }

    // Family-level theme from the aett, at a lighter weight than the rune itself.
    const aett = (native.factors.aett?.value as { aett?: string } | undefined)?.aett;
    const aettTheme = aett ? AETT_THEME[aett] : undefined;
    if (aett && aettTheme && isRegistered("theme", aettTheme)) {
      primitives.push({
        axis: "theme",
        value: aettTheme,
        weight: 0.3,
        source: meta.id,
        derivedFrom: "date",
        native: { factorKey: "aett", raw: aett },
      });
    }

    return primitives;
  },
};
