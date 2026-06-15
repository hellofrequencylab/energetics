import type { NativeResult, Primitive, SemanticAdapter } from "@/lib/core/contracts";
import { isRegistered } from "@/lib/ontology/axes";
import { ONTOLOGY_VERSION } from "@/lib/ontology/version";
import { meta } from "./engine";

/**
 * Sephirah → curated theme (each registered in ontology THEMES). Defensible
 * readings of the ten spheres: the crown as vision, wisdom as intuition,
 * understanding as analysis, mercy as nurture, severity as discipline, beauty as
 * devotion (the harmonizing heart), victory as play (drive and feeling), splendor
 * as communication (intellect and word), foundation as sensitivity, and kingdom
 * as structure (the manifest, grounded world).
 */
const SEPHIRAH_THEME: Record<string, string> = {
  keter: "vision",
  chokmah: "intuition",
  binah: "analysis",
  chesed: "nurture",
  gevurah: "discipline",
  tiferet: "devotion",
  netzach: "play",
  hod: "communication",
  yesod: "sensitivity",
  malkuth: "structure",
};

/** Sephirah → life domain (each registered in ontology DOMAINS). */
const SEPHIRAH_DOMAIN: Record<string, string> = {
  keter: "spirituality",
  chokmah: "spirituality",
  binah: "philosophy",
  chesed: "relationship",
  gevurah: "self",
  tiferet: "creativity",
  netzach: "creativity",
  hod: "communication",
  yesod: "home",
  malkuth: "resources",
};

/** World → theme (each registered). The four planes from action to spirit. */
const WORLD_THEME: Record<string, string> = {
  assiah: "structure",
  yetzirah: "sensitivity",
  beriah: "analysis",
  atziluth: "vision",
};

/** Root number → theme, the numerology bridge (each registered). */
const ROOT_THEME: Record<number, string> = {
  1: "leadership",
  2: "sensitivity",
  3: "communication",
  4: "structure",
  5: "exploration",
  6: "nurture",
  7: "analysis",
  8: "sovereignty",
  9: "service",
};

export const adapter: SemanticAdapter = {
  systemId: meta.id,
  ontologyVersion: ONTOLOGY_VERSION,
  toPrimitives(native: NativeResult): Primitive[] {
    const primitives: Primitive[] = [];

    const sephFactor = native.factors.sephirah;
    if (sephFactor) {
      const seph = sephFactor.value as { key: string; pillar: string };
      const base = { source: meta.id, derivedFrom: "name" as const, native: { factorKey: "sephirah", raw: seph } };

      // The sephirah is the headline placement: theme + domain at full weight.
      const theme = SEPHIRAH_THEME[seph.key];
      if (theme && isRegistered("theme", theme)) {
        primitives.push({ axis: "theme", value: theme, weight: 0.9, ...base });
      }
      const domain = SEPHIRAH_DOMAIN[seph.key];
      if (domain && isRegistered("domain", domain)) {
        primitives.push({ axis: "domain", value: domain, weight: 0.6, ...base });
      }

      // Pillar → polarity. The Pillar of Force initiates (active), the Pillar of
      // Form receives and shapes (receptive), the Pillar of Balance reconciles.
      const polarity =
        seph.pillar === "right" ? "active" : seph.pillar === "left" ? "receptive" : "balanced";
      primitives.push({
        axis: "polarity",
        value: polarity,
        weight: 0.6,
        source: meta.id,
        derivedFrom: "name",
        native: { factorKey: "pillar", raw: seph.pillar },
      });
    }

    // World: a softer, plane-of-being theme.
    const worldFactor = native.factors.world;
    if (worldFactor) {
      const world = worldFactor.value as { key: string };
      const theme = WORLD_THEME[world.key];
      if (theme && isRegistered("theme", theme)) {
        primitives.push({
          axis: "theme",
          value: theme,
          weight: 0.4,
          source: meta.id,
          derivedFrom: "name",
          native: { factorKey: "world", raw: world.key },
        });
      }
    }

    // Root number: the numerology bridge, a light theme so the Tree can converge
    // with the name and date numerologies.
    const root = native.factors.root?.value as number | undefined;
    if (typeof root === "number") {
      const theme = ROOT_THEME[root];
      if (theme && isRegistered("theme", theme)) {
        primitives.push({
          axis: "theme",
          value: theme,
          weight: 0.45,
          source: meta.id,
          derivedFrom: "name",
          native: { factorKey: "root", raw: root },
        });
      }
    }

    return primitives;
  },
};
