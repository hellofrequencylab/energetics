import type { NativeResult, Primitive, SemanticAdapter } from "@/lib/core/contracts";
import { ONTOLOGY_VERSION } from "@/lib/ontology/version";
import { meta } from "./engine";

/**
 * Gene Keys to ontology themes. We do NOT reproduce the licensed per-gate Gene
 * Keys corpus: we map each sphere (and its line) to our own registered THEMES,
 * DOMAINS, and POLARITY, so the three sequences show as connections in the
 * synthesis. Gene Keys is ephemeris-derived and depends on Human Design, so it
 * shares that independence group and never inflates the count, it only adds
 * threads.
 */

/** Each sphere → a registered theme, a life domain, and a coarse polarity. */
const SPHERE_MAP: Record<string, { theme: string; domain: string; polarity: string }> = {
  // Activation Sequence
  lifesWork: { theme: "vision", domain: "vocation", polarity: "active" },
  evolution: { theme: "transformation", domain: "transformation", polarity: "receptive" },
  radiance: { theme: "play", domain: "service-health", polarity: "balanced" },
  purpose: { theme: "service", domain: "spirituality", polarity: "receptive" },
  // Venus Sequence
  attraction: { theme: "devotion", domain: "relationship", polarity: "receptive" },
  iq: { theme: "analysis", domain: "philosophy", polarity: "active" },
  eq: { theme: "sensitivity", domain: "relationship", polarity: "receptive" },
  sq: { theme: "intuition", domain: "self", polarity: "balanced" },
  core: { theme: "transformation", domain: "relationship", polarity: "receptive" },
  // Pearl Sequence
  vocation: { theme: "leadership", domain: "vocation", polarity: "active" },
  culture: { theme: "service", domain: "community", polarity: "balanced" },
  brand: { theme: "play", domain: "resources", polarity: "balanced" },
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
    const emit = (axis: Primitive["axis"], value: string, weight: number, factorKey: string, raw: unknown) =>
      primitives.push({ axis, value, weight, source: meta.id, derivedFrom: "ephemeris", native: { factorKey, raw } });

    for (const [key, m] of Object.entries(SPHERE_MAP)) {
      const v = native.factors[key]?.value as { gate?: number; line?: number } | undefined;
      if (!v) continue;
      // Prime Activation spheres carry the most native salience; the Venus and
      // Pearl spheres are real but secondary threads.
      const isPrime = ["lifesWork", "evolution", "radiance", "purpose"].includes(key);
      const baseWeight = isPrime ? 0.55 : 0.45;
      emit("theme", m.theme, baseWeight, key, v.gate ?? null);
      emit("domain", m.domain, baseWeight - 0.1, key, v.gate ?? null);
      emit("polarity", m.polarity, baseWeight - 0.15, key, v.gate ?? null);

      const lineTheme = v.line != null ? LINE_THEME[v.line] : undefined;
      if (lineTheme) emit("theme", lineTheme, isPrime ? 0.35 : 0.28, key, v.line ?? null);
    }

    // Keynote line: the line most repeated across the prime four spheres, a light
    // reinforcement of how you tend to embody your gifts.
    const keynote = native.factors.keynoteLine?.value as number | undefined;
    const keynoteTheme = keynote != null ? LINE_THEME[keynote] : undefined;
    if (keynoteTheme) emit("theme", keynoteTheme, 0.4, "keynoteLine", keynote);

    return primitives;
  },
};
