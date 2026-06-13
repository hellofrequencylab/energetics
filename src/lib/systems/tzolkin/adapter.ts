import type { NativeResult, Primitive, SemanticAdapter } from "@/lib/core/contracts";
import { ONTOLOGY_VERSION } from "@/lib/ontology/version";
import { meta } from "./engine";

/** Day-sign → curated theme (registered in ontology THEMES). */
const SIGN_THEME: Record<string, string> = {
  Imix: "nurture",
  "Ik'": "communication",
  "Ak'b'al": "intuition",
  "K'an": "structure",
  Chikchan: "transformation",
  Kimi: "transformation",
  "Manik'": "service",
  Lamat: "play",
  Muluk: "sensitivity",
  Ok: "devotion",
  Chuwen: "play",
  "Eb'": "service",
  "B'en": "leadership",
  Ix: "sovereignty",
  Men: "vision",
  "Kib'": "intuition",
  "Kab'an": "analysis",
  "Etz'nab'": "analysis",
  Kawak: "transformation",
  Ajaw: "sovereignty",
};

export const adapter: SemanticAdapter = {
  systemId: meta.id,
  ontologyVersion: ONTOLOGY_VERSION,
  toPrimitives(native: NativeResult): Primitive[] {
    const primitives: Primitive[] = [];
    const sign = native.factors["day-sign"];
    if (sign) {
      const { daySign } = sign.value as { daySign: string };
      const theme = SIGN_THEME[daySign];
      if (theme) {
        primitives.push({
          axis: "theme",
          value: theme,
          weight: 0.8,
          source: meta.id,
          derivedFrom: "date",
          native: { factorKey: "day-sign", raw: daySign },
        });
      }
    }
    const toneFactor = native.factors.tone;
    if (toneFactor) {
      const tone = toneFactor.value as number;
      // Odd tones initiate (active); even tones stabilize/receive.
      primitives.push({
        axis: "polarity",
        value: tone % 2 === 1 ? "active" : "receptive",
        weight: 0.4,
        source: meta.id,
        derivedFrom: "date",
        native: { factorKey: "tone", raw: tone },
      });
    }
    return primitives;
  },
};
