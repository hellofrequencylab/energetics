import type { NativeResult, Primitive, SemanticAdapter } from "@/lib/core/contracts";
import { ONTOLOGY_VERSION } from "@/lib/ontology/version";
import { meta } from "./engine";
import type { CenterId } from "./data";

const TYPE_THEMES: Record<string, { themes: string[]; polarity: string }> = {
  Manifestor: { themes: ["leadership", "transformation"], polarity: "active" },
  Generator: { themes: ["service", "nurture"], polarity: "balanced" },
  "Manifesting Generator": { themes: ["leadership", "service"], polarity: "active" },
  Projector: { themes: ["vision", "analysis"], polarity: "receptive" },
  Reflector: { themes: ["intuition", "sensitivity"], polarity: "receptive" },
};

const AUTHORITY_THEME: Record<string, string> = {
  Emotional: "sensitivity",
  Sacral: "intuition",
  Splenic: "intuition",
  Ego: "discipline",
  "Self-Projected": "vision",
  "Mental (outer)": "analysis",
  Lunar: "sensitivity",
};

/** Center → namespaced ontology value + functional theme(s). */
const CENTER_MAP: Record<CenterId, { value: string; themes: string[] }> = {
  Head: { value: "hd:head", themes: ["vision"] },
  Ajna: { value: "hd:ajna", themes: ["analysis"] },
  Throat: { value: "hd:throat", themes: ["communication"] },
  G: { value: "hd:g", themes: ["sovereignty", "vision"] },
  Heart: { value: "hd:heart", themes: ["discipline", "sovereignty"] },
  Sacral: { value: "hd:sacral", themes: ["nurture", "structure"] },
  SolarPlexus: { value: "hd:solar-plexus", themes: ["sensitivity"] },
  Spleen: { value: "hd:spleen", themes: ["intuition"] },
  Root: { value: "hd:root", themes: ["discipline"] },
};

const PROFILE_LINE_THEME: Record<number, string> = {
  1: "analysis", 2: "intuition", 3: "exploration", 4: "devotion", 5: "leadership", 6: "vision",
};

export const adapter: SemanticAdapter = {
  systemId: meta.id,
  ontologyVersion: ONTOLOGY_VERSION,
  toPrimitives(native: NativeResult): Primitive[] {
    const primitives: Primitive[] = [];
    const emit = (axis: Primitive["axis"], value: string, weight: number, factorKey: string, raw: unknown) =>
      primitives.push({ axis, value, weight, source: meta.id, derivedFrom: "ephemeris", native: { factorKey, raw } });

    const type = native.factors.type?.value as string | undefined;
    if (type && TYPE_THEMES[type]) {
      emit("polarity", TYPE_THEMES[type].polarity, 0.85, "type", type);
      for (const t of TYPE_THEMES[type].themes) emit("theme", t, 0.85, "type", type);
    }

    const authority = native.factors.authority?.value as string | undefined;
    if (authority && AUTHORITY_THEME[authority]) emit("theme", AUTHORITY_THEME[authority], 0.8, "authority", authority);

    const centers = native.factors.centers?.value as Record<CenterId, boolean> | undefined;
    if (centers) {
      for (const [center, defined] of Object.entries(centers) as [CenterId, boolean][]) {
        if (!defined) continue;
        const m = CENTER_MAP[center];
        emit("center", m.value, 0.7, "centers", center);
        for (const t of m.themes) emit("theme", t, 0.7, "centers", center);
        if (center === "Spleen") emit("domain", "service-health", 0.6, "centers", center);
      }
    }

    const profile = native.factors.profile?.value as string | undefined;
    if (profile) {
      for (const part of profile.split("/")) {
        const theme = PROFILE_LINE_THEME[Number(part)];
        if (theme) emit("theme", theme, 0.5, "profile", profile);
      }
    }

    return primitives;
  },
};
