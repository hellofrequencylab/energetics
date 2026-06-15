import type { NativeResult, Primitive, SemanticAdapter } from "@/lib/core/contracts";
import { isRegistered } from "@/lib/ontology/axes";
import { ONTOLOGY_VERSION } from "@/lib/ontology/version";
import { meta } from "./engine";

/**
 * Native day-sign (Yucatec key) → ontology mapping. Every value is checked
 * against the registered vocabulary at emit time via isRegistered, so a vocab
 * change can never silently leak an unregistered term.
 *
 * theme   : the strength the nawal carries by instinct (registered THEMES).
 * theme2  : an optional second, quieter strength of the same nawal.
 * domain  : the life area where that nawal most naturally lands (registered DOMAINS).
 *
 * The choices stay close to widely shared daykeeper readings of each sign:
 * Imix as the deep waters and origin (home), Ik' as breath and word
 * (communication), Manik' as the helping hand (service-health), and so on. They
 * are deliberately conservative so cross-system convergences are defensible.
 */
interface SignMap {
  theme: string;
  theme2?: string;
  domain: string;
}

const SIGN: Record<string, SignMap> = {
  Imix: { theme: "nurture", theme2: "intuition", domain: "home" },
  "Ik'": { theme: "communication", theme2: "vision", domain: "communication" },
  "Ak'bal": { theme: "intuition", theme2: "nurture", domain: "home" },
  "K'an": { theme: "structure", theme2: "discipline", domain: "resources" },
  Chikchan: { theme: "transformation", theme2: "intuition", domain: "spirituality" },
  Kimi: { theme: "transformation", theme2: "service", domain: "transformation" },
  "Manik'": { theme: "service", theme2: "devotion", domain: "service-health" },
  Lamat: { theme: "play", theme2: "exploration", domain: "creativity" },
  Muluk: { theme: "sensitivity", theme2: "intuition", domain: "spirituality" },
  Ok: { theme: "devotion", theme2: "nurture", domain: "relationship" },
  Chuwen: { theme: "play", theme2: "communication", domain: "creativity" },
  Eb: { theme: "service", theme2: "exploration", domain: "community" },
  Ben: { theme: "leadership", theme2: "discipline", domain: "home" },
  Ix: { theme: "sovereignty", theme2: "intuition", domain: "spirituality" },
  Men: { theme: "vision", theme2: "exploration", domain: "philosophy" },
  Kib: { theme: "intuition", theme2: "discipline", domain: "philosophy" },
  Kaban: { theme: "analysis", theme2: "communication", domain: "philosophy" },
  "Etz'nab": { theme: "analysis", theme2: "transformation", domain: "relationship" },
  Kawak: { theme: "transformation", theme2: "communication", domain: "community" },
  Ajaw: { theme: "sovereignty", theme2: "leadership", domain: "vocation" },
};

/**
 * Galactic tone (1..13) → theme along the wave's arc. The thirteen tones move
 * from the first initiating spark, through gathering and balance in the middle,
 * to release and full overflow at the top. We name the broad arc only, softly
 * (low weight), so the day sign stays the loudest voice.
 */
function toneTheme(tone: number): string | undefined {
  if (tone <= 4) return "leadership"; // 1-4: the spark sets out and takes form
  if (tone <= 9) return "structure"; // 5-9: gathering, command, and balance
  return "service"; // 10-13: refining, releasing, and giving back
}

/**
 * The four directions read as the four Western elements through a defensible
 * directional correspondence: the rising East as fire, the clear North as air,
 * the transforming West as water, the grounded South as earth. Soft weight, a
 * quiet seasoning beneath the nawal. Only emitted as registered element terms.
 */
const DIRECTION_ELEMENT: Record<string, string> = {
  East: "western:fire",
  North: "western:air",
  West: "western:water",
  South: "western:earth",
};

export const adapter: SemanticAdapter = {
  systemId: meta.id,
  ontologyVersion: ONTOLOGY_VERSION,
  toPrimitives(native: NativeResult): Primitive[] {
    const primitives: Primitive[] = [];

    const sign = native.factors["day-sign"];
    if (sign) {
      const { daySign } = sign.value as { daySign: string };
      const map = SIGN[daySign];
      if (map) {
        // Day sign carries the loudest theme.
        if (isRegistered("theme", map.theme)) {
          primitives.push({
            axis: "theme",
            value: map.theme,
            weight: 0.8,
            source: meta.id,
            derivedFrom: "date",
            native: { factorKey: "day-sign", raw: daySign },
          });
        }
        // A quieter second strength of the same nawal.
        if (map.theme2 && isRegistered("theme", map.theme2)) {
          primitives.push({
            axis: "theme",
            value: map.theme2,
            weight: 0.45,
            source: meta.id,
            derivedFrom: "date",
            native: { factorKey: "day-sign", raw: daySign },
          });
        }
        // And the life area where the nawal most naturally lands.
        if (isRegistered("domain", map.domain)) {
          primitives.push({
            axis: "domain",
            value: map.domain,
            weight: 0.5,
            source: meta.id,
            derivedFrom: "date",
            native: { factorKey: "day-sign", raw: daySign },
          });
        }
      }
    }

    const toneFactor = native.factors.tone;
    if (toneFactor) {
      const tone = toneFactor.value as number;
      // Odd/even tone reads as active/receptive, the original primitive.
      primitives.push({
        axis: "polarity",
        value: tone % 2 === 1 ? "active" : "receptive",
        weight: 0.4,
        source: meta.id,
        derivedFrom: "date",
        native: { factorKey: "tone", raw: tone },
      });
      // The tone's place along the 13-step wave reads as a soft theme arc.
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

    // Direction reads as a soft element seasoning beneath the nawal.
    const dirFactor = native.factors.direction;
    if (dirFactor) {
      const { direction } = dirFactor.value as { direction: string };
      const element = DIRECTION_ELEMENT[direction];
      if (element && isRegistered("element", element)) {
        primitives.push({
          axis: "element",
          value: element,
          weight: 0.35,
          source: meta.id,
          derivedFrom: "date",
          native: { factorKey: "direction", raw: direction },
        });
      }
    }

    // The trecena (the opening sign of the thirteen-day wave you ride) lends a
    // quiet background theme: the broader current your own day moves within.
    const trecenaFactor = native.factors.trecena;
    if (trecenaFactor) {
      const { trecena } = trecenaFactor.value as { trecena: string };
      const map = SIGN[trecena];
      if (map && isRegistered("theme", map.theme)) {
        primitives.push({
          axis: "theme",
          value: map.theme,
          weight: 0.3,
          source: meta.id,
          derivedFrom: "date",
          native: { factorKey: "trecena", raw: trecena },
        });
      }
    }

    // The Year Bearer (the Mam carrying the solar year) adds the faintest theme
    // from the day sign that holds the year you were born into.
    const bearerFactor = native.factors["year-bearer"];
    if (bearerFactor) {
      const { daySign } = bearerFactor.value as { daySign: string };
      const map = SIGN[daySign];
      if (map && isRegistered("theme", map.theme)) {
        primitives.push({
          axis: "theme",
          value: map.theme,
          weight: 0.2,
          source: meta.id,
          derivedFrom: "date",
          native: { factorKey: "year-bearer", raw: daySign },
        });
      }
    }

    return primitives;
  },
};
