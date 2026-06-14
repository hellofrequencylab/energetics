/**
 * Per-system "energy cheat sheet": a few plain-language lines that say, at a
 * glance, what a system reads in this chart. It prefers the interpretation corpus
 * (original quick-guide prose) and falls back to a small, original lexicon for the
 * systems the corpus does not cover yet. Deterministic, no model, no copyrighted
 * text. Read only: it never changes the structural synthesis.
 */
import type { ComputedSystem } from "@/lib/synthesis/types";
import { interpretationsFor } from "@/lib/corpus";

export interface EnergyLine {
  term: string;
  gist: string;
}

export function energyCheatSheet(c: ComputedSystem): EnergyLine[] {
  const corpus = interpretationsFor(c.meta.id, c.native).map((l) => ({ term: l.label, gist: l.text }));
  if (corpus.length) return corpus.slice(0, 4);
  return fallback(c);
}

// --- Fallbacks for systems the corpus does not cover yet --------------------

const HD_TYPE: Record<string, string> = {
  Manifestor: "Here to initiate. You start things and make an impact. Inform people, then move on your own steam.",
  Generator: "Built to respond. Your energy sustains work you love. Wait for what lights you up, then commit fully.",
  "Manifesting Generator": "Respond, then move fast. You build momentum quickly and can skip steps. Let your gut lead.",
  Projector: "Here to guide. You read people and systems clearly. Wait to be recognized and invited before you steer.",
  Reflector: "A mirror of your surroundings. You sample the room. Give big choices a full lunar cycle.",
};
const HD_AUTHORITY: Record<string, string> = {
  Emotional: "Decide over time, not on the spot. Sleep on it and let the feeling settle into clarity.",
  Sacral: "Trust the gut response, the yes or no you feel in the moment.",
  Splenic: "Trust the quiet intuition. It speaks once, in the now.",
  Ego: "Decide from the heart and will: what you genuinely want and have the energy for.",
  "Self-Projected": "Talk it out. Your truth is in your own voice as you hear yourself speak.",
  Mental: "Think out loud with trusted people and feel your environment. Clarity arrives from outside.",
  Lunar: "Take a full cycle before a major decision.",
};

const BAZI_ELEMENT: Record<string, string> = {
  wood: "growth-oriented and upright. You expand, plan, and push toward the light",
  fire: "warm, expressive, and visible. You energize and illuminate",
  earth: "grounding and dependable. You stabilize, hold, and provide",
  metal: "clear, principled, and refined. You cut to what matters",
  water: "adaptive, deep, and flowing. You sense, connect, and move around obstacles",
};

function factorVal<T>(c: ComputedSystem, key: string): T | undefined {
  return c.native.factors[key]?.value as T | undefined;
}
function factorDisplay(c: ComputedSystem, key: string): string | undefined {
  return c.native.factors[key]?.display;
}

function fallback(c: ComputedSystem): EnergyLine[] {
  switch (c.meta.id) {
    case "human-design": {
      const type = factorVal<string>(c, "type");
      const authority = factorVal<string>(c, "authority");
      const profile = factorDisplay(c, "profile");
      const lines: EnergyLine[] = [];
      if (type) lines.push({ term: type, gist: HD_TYPE[type] ?? "Your energy type, how you are designed to engage." });
      if (authority)
        lines.push({ term: `${authority} authority`, gist: HD_AUTHORITY[authority] ?? "How you are designed to decide." });
      if (profile) lines.push({ term: `Profile ${profile}`, gist: "The mix of roles you live out as you meet the world." });
      return lines;
    }
    case "chinese-bazi": {
      const dm = factorVal<{ element: string; polarity: string }>(c, "day-master");
      const animal = factorVal<{ animal: string }>(c, "animal")?.animal;
      const lines: EnergyLine[] = [];
      if (dm?.element) {
        const key = dm.polarity === "Yang" ? "in an active, outward key" : "in a receptive, inward key";
        lines.push({
          term: `${dm.polarity} ${cap(dm.element)} day master`,
          gist: `Your core self is ${BAZI_ELEMENT[dm.element] ?? "your day master element"}, ${key}.`,
        });
      }
      if (animal) lines.push({ term: `Year of the ${animal}`, gist: "The seasonal animal your birth year carries." });
      return lines;
    }
    case "dreamspell": {
      const seal = factorDisplay(c, "seal");
      const tone = factorDisplay(c, "tone");
      const lines: EnergyLine[] = [];
      if (seal) lines.push({ term: seal, gist: "Your Dreamspell solar seal, a modern reconstruction shown for interest." });
      if (tone) lines.push({ term: `Tone ${tone}`, gist: "The galactic tone of your signature, its rhythm and role." });
      return lines;
    }
    default: {
      // Generic: surface the first few headline factors as-is.
      return Object.values(c.native.factors)
        .slice(0, 3)
        .map((f) => ({ term: f.label, gist: String(f.display ?? f.value) }));
    }
  }
}

function cap(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}
