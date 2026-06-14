import type { NativeResult, Primitive, SemanticAdapter } from "@/lib/core/contracts";
import { ONTOLOGY_VERSION } from "@/lib/ontology/version";
import { meta } from "./engine";

/**
 * Gene Keys to ontology themes. We do NOT reproduce the licensed per-gate Gene
 * Keys corpus: we map each prime sphere (and the line) to our own registered
 * THEMES, so the Activation Sequence shows as connections in the synthesis. Gene
 * Keys is ephemeris-derived and depends on Human Design, so it shares that
 * independence group and never inflates the count, it only adds threads.
 */
const SPHERE_THEME: Record<string, string> = {
  lifesWork: "vision",
  evolution: "transformation",
  radiance: "play",
  purpose: "service",
};
const LINE_THEME: Record<number, string> = {
  1: "analysis",
  2: "intuition",
  3: "exploration",
  4: "devotion",
  5: "leadership",
  6: "vision",
};

export const adapter: SemanticAdapter = {
  systemId: meta.id,
  ontologyVersion: ONTOLOGY_VERSION,
  toPrimitives(native: NativeResult): Primitive[] {
    const primitives: Primitive[] = [];
    for (const [key, theme] of Object.entries(SPHERE_THEME)) {
      const v = native.factors[key]?.value as { gate?: number; line?: number } | undefined;
      if (!v) continue;
      primitives.push({
        axis: "theme",
        value: theme,
        weight: 0.55,
        source: meta.id,
        derivedFrom: "ephemeris",
        native: { factorKey: key, raw: v.gate ?? null },
      });
      const lineTheme = v.line != null ? LINE_THEME[v.line] : undefined;
      if (lineTheme) {
        primitives.push({
          axis: "theme",
          value: lineTheme,
          weight: 0.35,
          source: meta.id,
          derivedFrom: "ephemeris",
          native: { factorKey: key, raw: v.line ?? null },
        });
      }
    }
    return primitives;
  },
};
