import type { NativeResult, Primitive, SemanticAdapter } from "@/lib/core/contracts";
import { isRegistered } from "@/lib/ontology/axes";
import { ONTOLOGY_VERSION } from "@/lib/ontology/version";
import { meta } from "./engine";

/**
 * Native day-sign (Yucatec key) → ontology mapping. Every value is checked
 * against the registered vocabulary at emit time via isRegistered, so a vocab
 * change can never silently leak an unregistered term.
 *
 * theme  : the strength the nawal carries by instinct (registered THEMES).
 * domain : the life area where that nawal most naturally lands (registered DOMAINS).
 *
 * The choices stay close to widely shared daykeeper readings of each sign:
 * Imix as the deep waters and origin (home), Ik' as breath and word
 * (communication), Manik' as the helping hand (service-health), and so on. They
 * are deliberately conservative so cross-system convergences are defensible.
 */
interface SignMap {
  theme: string;
  domain: string;
}

const SIGN: Record<string, SignMap> = {
  Imix: { theme: "nurture", domain: "home" },
  "Ik'": { theme: "communication", domain: "communication" },
  "Ak'bal": { theme: "intuition", domain: "home" },
  "K'an": { theme: "structure", domain: "resources" },
  Chikchan: { theme: "transformation", domain: "spirituality" },
  Kimi: { theme: "transformation", domain: "transformation" },
  "Manik'": { theme: "service", domain: "service-health" },
  Lamat: { theme: "play", domain: "creativity" },
  Muluk: { theme: "sensitivity", domain: "spirituality" },
  Ok: { theme: "devotion", domain: "relationship" },
  Chuwen: { theme: "play", domain: "creativity" },
  Eb: { theme: "service", domain: "community" },
  Ben: { theme: "leadership", domain: "home" },
  Ix: { theme: "sovereignty", domain: "spirituality" },
  Men: { theme: "vision", domain: "philosophy" },
  Kib: { theme: "intuition", domain: "philosophy" },
  Kaban: { theme: "analysis", domain: "philosophy" },
  "Etz'nab": { theme: "analysis", domain: "relationship" },
  Kawak: { theme: "transformation", domain: "community" },
  Ajaw: { theme: "sovereignty", domain: "vocation" },
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

    return primitives;
  },
};
