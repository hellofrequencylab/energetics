import type { NativeResult, Primitive, SemanticAdapter } from "@/lib/core/contracts";
import { isRegistered } from "@/lib/ontology/axes";
import { ONTOLOGY_VERSION } from "@/lib/ontology/version";
import { meta } from "./engine";

/** Major Arcana number -> curated theme (registered in ontology THEMES). */
const ARCANA_THEME: Record<number, string> = {
  0: "exploration", // Fool
  1: "communication", // Magician
  2: "intuition", // High Priestess
  3: "nurture", // Empress
  4: "structure", // Emperor
  5: "devotion", // Hierophant
  6: "devotion", // Lovers
  7: "discipline", // Chariot
  8: "sovereignty", // Strength
  9: "analysis", // Hermit
  10: "transformation", // Wheel
  11: "analysis", // Justice
  12: "sensitivity", // Hanged Man
  13: "transformation", // Death
  14: "service", // Temperance
  15: "sovereignty", // Devil
  16: "transformation", // Tower
  17: "vision", // Star
  18: "intuition", // Moon
  19: "play", // Sun
  20: "vision", // Judgement
  21: "sovereignty", // World
};

/**
 * A defensible second theme for cards whose single tag is reductive. These are
 * the strongest registered facet beyond the primary theme, emitted at a lower
 * weight so the primary still leads. Cards not listed keep a single theme.
 */
const ARCANA_SECONDARY_THEME: Record<number, string> = {
  0: "play", // Fool: the leap and the lightness behind the wandering
  1: "leadership", // Magician: directing will and resources
  4: "leadership", // Emperor: structure exercised as command
  6: "sensitivity", // Lovers: relating, choosing with the heart
  7: "sovereignty", // Chariot: disciplined will under one's own command
  8: "discipline", // Strength: steady inner mastery
  10: "vision", // Wheel: reading the turning pattern
  14: "transformation", // Temperance: change by patient blending
  16: "transformation", // Tower: change through sudden release (with primary)
  17: "service", // Star: pouring out, replenishing others
  19: "leadership", // Sun: confident, visible warmth
  21: "service", // World: completion offered back to the whole
};

/**
 * Card-to-life-area, registered DOMAINS. Each Major leans toward one arena where
 * its theme most naturally lands; lower weight than theme since it is a softer
 * mapping.
 */
const ARCANA_DOMAIN: Record<number, string> = {
  0: "self", // Fool
  1: "communication", // Magician
  2: "spirituality", // High Priestess
  3: "creativity", // Empress
  4: "vocation", // Emperor
  5: "philosophy", // Hierophant
  6: "relationship", // Lovers
  7: "self", // Chariot
  8: "self", // Strength
  9: "philosophy", // Hermit
  10: "transformation", // Wheel
  11: "community", // Justice
  12: "spirituality", // Hanged Man
  13: "transformation", // Death
  14: "service-health", // Temperance
  15: "resources", // Devil
  16: "transformation", // Tower
  17: "spirituality", // Star
  18: "home", // Moon
  19: "creativity", // Sun
  20: "vocation", // Judgement
  21: "community", // World
};

/** Per-factor base weight for the primary theme. */
const FACTOR_WEIGHT: Record<string, number> = {
  personality: 0.45,
  soul: 0.55,
  teacher: 0.35,
};

export const adapter: SemanticAdapter = {
  systemId: meta.id,
  ontologyVersion: ONTOLOGY_VERSION,
  toPrimitives(native: NativeResult): Primitive[] {
    const primitives: Primitive[] = [];
    for (const key of ["personality", "soul", "teacher"]) {
      const factor = native.factors[key];
      if (!factor) continue;
      const { number } = factor.value as { number: number };
      const base = {
        source: meta.id,
        derivedFrom: "date" as const,
        native: { factorKey: key, raw: number },
      };
      const w = FACTOR_WEIGHT[key] ?? 0.45;

      const theme = ARCANA_THEME[number];
      if (theme && isRegistered("theme", theme)) {
        primitives.push({ axis: "theme", value: theme, weight: w, ...base });
      }

      const secondary = ARCANA_SECONDARY_THEME[number];
      if (secondary && secondary !== theme && isRegistered("theme", secondary)) {
        primitives.push({ axis: "theme", value: secondary, weight: w * 0.6, ...base });
      }

      // Even-numbered Majors read receptive, odd ones active. The Fool (0) is the
      // open, receptive beginning. Mirrors the sibling numerology polarity rule.
      const polarity = number % 2 === 1 ? "active" : "receptive";
      primitives.push({ axis: "polarity", value: polarity, weight: w * 0.7, ...base });

      const domain = ARCANA_DOMAIN[number];
      if (domain && isRegistered("domain", domain)) {
        primitives.push({ axis: "domain", value: domain, weight: w * 0.5, ...base });
      }
    }
    return primitives;
  },
};
