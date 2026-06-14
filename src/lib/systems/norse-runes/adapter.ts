import type { NativeResult, Primitive, SemanticAdapter } from "@/lib/core/contracts";
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

export const adapter: SemanticAdapter = {
  systemId: meta.id,
  ontologyVersion: ONTOLOGY_VERSION,
  toPrimitives(native: NativeResult): Primitive[] {
    const rune = (native.factors.rune?.value as { rune?: string } | undefined)?.rune;
    if (!rune) return [];
    return (RUNE_THEME[rune] ?? []).map((value) => ({
      axis: "theme",
      value,
      weight: 0.45,
      source: meta.id,
      derivedFrom: "date",
      native: { factorKey: "rune", raw: rune },
    }));
  },
};
