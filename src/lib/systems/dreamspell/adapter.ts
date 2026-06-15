import type { NativeResult, Primitive, SemanticAdapter } from "@/lib/core/contracts";
import { isRegistered } from "@/lib/ontology/axes";
import { ONTOLOGY_VERSION } from "@/lib/ontology/version";
import { meta } from "./engine";

/**
 * Native Dreamspell → ontology mapping.
 *
 * IMPORTANT: Dreamspell is a modern reconstruction and is excluded from the
 * structural synthesis by the catalog (inSynthesis: false), so these primitives
 * are NEVER clustered with the living tradition or any other system. They exist
 * only so the per-system card and detail page can show an auditable, registered
 * reading of the signature, in step with the engine. Lineage is labeled, not
 * laundered (spec §1.8).
 *
 * Every emitted value is checked against the registered vocabulary via
 * isRegistered, so a vocab change can never leak an unregistered term. The
 * readings are our own plain take on each seal, tone, and color, and reproduce
 * no copyrighted source material.
 *
 * theme   : the quality the solar seal carries (registered THEMES).
 * theme2  : an optional second, quieter strength of the same seal.
 * domain  : the life area where the seal most naturally lands (registered DOMAINS).
 */
interface SealMap {
  theme: string;
  theme2?: string;
  domain: string;
}

const SEAL: Record<string, SealMap> = {
  Dragon: { theme: "nurture", theme2: "leadership", domain: "home" },
  Wind: { theme: "communication", theme2: "vision", domain: "communication" },
  Night: { theme: "intuition", theme2: "nurture", domain: "home" },
  Seed: { theme: "structure", theme2: "discipline", domain: "resources" },
  Serpent: { theme: "sensitivity", theme2: "transformation", domain: "service-health" },
  WorldBridger: { theme: "transformation", theme2: "service", domain: "transformation" },
  Hand: { theme: "service", theme2: "devotion", domain: "service-health" },
  Star: { theme: "play", theme2: "exploration", domain: "creativity" },
  Moon: { theme: "sensitivity", theme2: "devotion", domain: "spirituality" },
  Dog: { theme: "devotion", theme2: "nurture", domain: "relationship" },
  Monkey: { theme: "play", theme2: "communication", domain: "creativity" },
  Human: { theme: "analysis", theme2: "communication", domain: "philosophy" },
  Skywalker: { theme: "exploration", theme2: "vision", domain: "philosophy" },
  Wizard: { theme: "intuition", theme2: "discipline", domain: "spirituality" },
  Eagle: { theme: "vision", theme2: "exploration", domain: "philosophy" },
  Warrior: { theme: "sovereignty", theme2: "discipline", domain: "self" },
  Earth: { theme: "structure", theme2: "intuition", domain: "philosophy" },
  Mirror: { theme: "analysis", theme2: "discipline", domain: "relationship" },
  Storm: { theme: "transformation", theme2: "communication", domain: "community" },
  Sun: { theme: "sovereignty", theme2: "leadership", domain: "vocation" },
};

/**
 * Color family directions read as the four Western elements through a defensible
 * directional correspondence: the rising East as fire, the clear North as air,
 * the transforming West as water, the grounded South as earth. Soft seasoning
 * beneath the seal. Only emitted as registered element terms.
 */
const COLOR_ELEMENT: Record<string, string> = {
  Red: "western:fire", // East
  White: "western:air", // North
  Blue: "western:water", // West
  Yellow: "western:earth", // South
};

/**
 * The tone's place along the 13-step wavespell reads as a soft theme arc, from
 * the initiating first tones, through the gathering and balancing middle, to the
 * releasing and giving-back top. Named softly so the seal stays the loudest.
 */
function toneTheme(tone: number): string | undefined {
  if (tone <= 4) return "leadership"; // 1-4: purpose and form
  if (tone <= 9) return "structure"; // 5-9: radiance, balance, attunement
  return "service"; // 10-13: manifest, release, return
}

export const adapter: SemanticAdapter = {
  systemId: meta.id,
  ontologyVersion: ONTOLOGY_VERSION,
  toPrimitives(native: NativeResult): Primitive[] {
    const primitives: Primitive[] = [];

    const sealFactor = native.factors.seal;
    if (sealFactor) {
      // The engine stores the plain seal name (e.g. "Wizard") in seal.value.
      const sealName = typeof sealFactor.value === "string" ? sealFactor.value : undefined;
      if (sealName) {
        const map = SEAL[sealName];
        if (map) {
          if (isRegistered("theme", map.theme)) {
            primitives.push({
              axis: "theme",
              value: map.theme,
              weight: 0.8,
              source: meta.id,
              derivedFrom: "date",
              native: { factorKey: "seal", raw: sealName },
            });
          }
          if (map.theme2 && isRegistered("theme", map.theme2)) {
            primitives.push({
              axis: "theme",
              value: map.theme2,
              weight: 0.45,
              source: meta.id,
              derivedFrom: "date",
              native: { factorKey: "seal", raw: sealName },
            });
          }
          if (isRegistered("domain", map.domain)) {
            primitives.push({
              axis: "domain",
              value: map.domain,
              weight: 0.5,
              source: meta.id,
              derivedFrom: "date",
              native: { factorKey: "seal", raw: sealName },
            });
          }
        }
      }
    }

    // Color family reads as a soft element beneath the seal.
    const colorFactor = native.factors.color;
    if (colorFactor) {
      const color = colorFactor.value as string;
      const element = COLOR_ELEMENT[color];
      if (element && isRegistered("element", element)) {
        primitives.push({
          axis: "element",
          value: element,
          weight: 0.35,
          source: meta.id,
          derivedFrom: "date",
          native: { factorKey: "color", raw: color },
        });
      }
    }

    const toneFactor = native.factors.tone;
    if (toneFactor) {
      const tone = toneFactor.value as number;
      // Odd/even tone reads as active/receptive.
      primitives.push({
        axis: "polarity",
        value: tone % 2 === 1 ? "active" : "receptive",
        weight: 0.4,
        source: meta.id,
        derivedFrom: "date",
        native: { factorKey: "tone", raw: tone },
      });
      const tTheme = toneTheme(tone);
      if (tTheme && isRegistered("theme", tTheme)) {
        primitives.push({
          axis: "theme",
          value: tTheme,
          weight: 0.3,
          source: meta.id,
          derivedFrom: "date",
          native: { factorKey: "tone", raw: tone },
        });
      }
    }

    return primitives;
  },
};
