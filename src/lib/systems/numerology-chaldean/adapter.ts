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

/** Add a theme primitive for one numerology factor, if the theme is registered. */
function pushTheme(
  primitives: Primitive[],
  native: NativeResult,
  factorKey: string,
  weight: number,
): void {
  const factor = native.factors[factorKey];
  if (!factor) return;
  const n = factor.value as number;
  const theme = NUMBER_THEME[n];
  if (!theme || !isRegistered("theme", theme)) return;
  primitives.push({
    axis: "theme",
    value: theme,
    weight,
    source: meta.id,
    derivedFrom: "name",
    native: { factorKey, raw: n },
  });
}

export const adapter: SemanticAdapter = {
  systemId: meta.id,
  ontologyVersion: ONTOLOGY_VERSION,
  toPrimitives(native: NativeResult): Primitive[] {
    const factor = native.factors["name-number"];
    if (!factor) return [];
    const n = factor.value as number;
    const primitives: Primitive[] = [];

    // Name number carries the loudest theme, then the soul urge (vowels) and the
    // personality (consonants) speak a touch more softly.
    pushTheme(primitives, native, "name-number", 0.7);
    pushTheme(primitives, native, "soul-urge", 0.5);
    pushTheme(primitives, native, "personality", 0.5);

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
