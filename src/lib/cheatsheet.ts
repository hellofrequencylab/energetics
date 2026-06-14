/**
 * Per-system "energy cheat sheet": the plain-language lines that say what a system
 * reads in this chart. It prefers the interpretation corpus (original quick-guide
 * and deep-dive prose) and fills in with a small, original lexicon for the systems
 * the corpus does not cover yet. Detailed enough to fill the card's right column.
 * Deterministic, no model, no copyrighted text. Read only: it never changes the
 * structural synthesis.
 */
import type { ComputedSystem } from "@/lib/synthesis/types";
import { interpretationsFor } from "@/lib/corpus";
import { ARCANA_GUIDE, DAYSIGN_GUIDE, SIGN_GUIDE, TONE_GUIDE } from "@/lib/corpus/data";
import { SIGN_DEEP } from "@/lib/corpus/deep";

export interface EnergyLine {
  term: string;
  gist: string;
}

export function energyCheatSheet(c: ComputedSystem): EnergyLine[] {
  switch (c.meta.id) {
    case "western-tropical":
      return western(c);
    case "vedic-jyotish":
      return vedic(c);
    case "numerology-pythagorean":
    case "numerology-chaldean":
      return numerology(c);
    case "tzolkin":
      return tzolkin(c);
    case "tarot-birth-cards":
      return tarot(c);
    case "chinese-bazi":
      return bazi(c);
    case "human-design":
      return humanDesign(c);
    case "dreamspell":
      return dreamspell(c);
    default:
      return generic(c);
  }
}

// --- helpers ---------------------------------------------------------------

function cap(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}
function val<T>(c: ComputedSystem, key: string): T | undefined {
  return c.native.factors[key]?.value as T | undefined;
}
function disp(c: ComputedSystem, key: string): string | undefined {
  return c.native.factors[key]?.display;
}
function label(c: ComputedSystem, key: string): string {
  return c.native.factors[key]?.label ?? key;
}

function balanceText(counts: Record<string, number>): string {
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (!sorted.length) return "";
  if (sorted.length === 1) return `Strongly ${sorted[0][0]}.`;
  const top = sorted[0];
  const tied = sorted.filter(([, n]) => n === top[1]);
  if (tied.length === sorted.length) return `Evenly balanced across ${sorted.map((s) => s[0]).join(", ")}.`;
  const rest = sorted.slice(1).filter(([, n]) => n > 0).map((s) => s[0]);
  return `Mostly ${top[0]}, with ${rest.join(" and ")}.`;
}

// --- Western ---------------------------------------------------------------

const SIGN_ELEMENT: Record<string, string> = {
  Aries: "Fire", Leo: "Fire", Sagittarius: "Fire",
  Taurus: "Earth", Virgo: "Earth", Capricorn: "Earth",
  Gemini: "Air", Libra: "Air", Aquarius: "Air",
  Cancer: "Water", Scorpio: "Water", Pisces: "Water",
};
const WESTERN_BODIES = [
  "sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn",
  "uranus", "neptune", "pluto", "northNode", "chiron",
];

function western(c: ComputedSystem): EnergyLine[] {
  const signOf = (k: string) => (val<{ sign?: string }>(c, k))?.sign;
  const lines: EnergyLine[] = [];

  // Element balance across the personal points.
  const counts: Record<string, number> = {};
  for (const k of ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "ascendant"]) {
    const e = signOf(k) && SIGN_ELEMENT[signOf(k)!];
    if (e) counts[e] = (counts[e] ?? 0) + 1;
  }
  const bal = balanceText(counts);
  if (bal) lines.push({ term: "Element balance", gist: bal });

  // Rising sign sets the tone if a timed chart unlocked it.
  const asc = signOf("ascendant");
  if (asc && SIGN_GUIDE[asc]) lines.push({ term: `${asc} rising`, gist: `How you meet the world. ${SIGN_GUIDE[asc]}` });

  // Luminaries get the deeper read; the rest get their sign's vibe.
  for (const k of ["sun", "moon"]) {
    const s = signOf(k);
    if (s) lines.push({ term: `${label(c, k)} in ${s}`, gist: SIGN_DEEP[s] ?? SIGN_GUIDE[s] ?? "" });
  }
  for (const k of WESTERN_BODIES) {
    if (k === "sun" || k === "moon") continue;
    const s = signOf(k);
    if (s && SIGN_GUIDE[s]) lines.push({ term: `${label(c, k)} in ${s}`, gist: SIGN_GUIDE[s] });
  }
  return lines;
}

function vedic(c: ComputedSystem): EnergyLine[] {
  const lines = interpretationsFor("vedic-jyotish", c.native).map((l) => ({ term: l.label, gist: l.text }));
  const nak = disp(c, "janma");
  if (nak) lines.push({ term: "Janma nakshatra", gist: `${nak}: your birth star, the Moon's mansion at your first breath.` });
  return lines;
}

// --- Numerology ------------------------------------------------------------

const NUMBER_DEEP: Record<number, string> = {
  1: "Its work is to lead without going it entirely alone.",
  2: "Its work is to keep its own center while caring for the bond.",
  3: "Its work is to finish what its imagination so eagerly starts.",
  4: "Its work is to build without becoming rigid.",
  5: "Its work is to find the freedom that does not scatter it.",
  6: "Its work is to care for others without losing itself.",
  7: "Its work is to trust people as much as it trusts ideas.",
  8: "Its work is to wield power and stay kind.",
  9: "Its work is to give, and also to let itself receive.",
  11: "Its work is to ground a big vision in something real.",
  22: "Its work is to turn a vast vision into patient, daily building.",
  33: "Its work is to serve from fullness, never from depletion.",
};

function numerology(c: ComputedSystem): EnergyLine[] {
  const lines = interpretationsFor(c.meta.id, c.native).map((l) => ({ term: l.label, gist: l.text }));
  const n = (val<number>(c, "life-path") ?? val<number>(c, "name-number"));
  if (n != null && NUMBER_DEEP[n]) lines.push({ term: "Its work", gist: NUMBER_DEEP[n] });
  if (n != null) lines.push({ term: "How it shows up", gist: "A current that colors your choices and timing, not a label that fixes them." });
  return lines;
}

function tzolkin(c: ComputedSystem): EnergyLine[] {
  const ds = (val<{ daySign?: string }>(c, "day-sign"))?.daySign;
  const tone = val<number>(c, "tone");
  const tre = (val<{ trecena?: string }>(c, "trecena"))?.trecena;
  const lines: EnergyLine[] = [];
  if (ds && DAYSIGN_GUIDE[ds]) lines.push({ term: `Day sign: ${ds}`, gist: DAYSIGN_GUIDE[ds] });
  if (tone != null && TONE_GUIDE[tone]) lines.push({ term: `Tone ${tone}`, gist: TONE_GUIDE[tone] });
  if (tre && DAYSIGN_GUIDE[tre]) lines.push({ term: `${tre} trecena`, gist: `The 13-day wave your day rides, themed by ${tre}.` });
  return lines;
}

function tarot(c: ComputedSystem): EnergyLine[] {
  const p = val<{ card?: string; number?: number }>(c, "personality");
  const s = val<{ card?: string; number?: number }>(c, "soul");
  const lines: EnergyLine[] = [];
  if (p?.number != null && ARCANA_GUIDE[p.number]) lines.push({ term: `Personality: ${p.card}`, gist: ARCANA_GUIDE[p.number] });
  if (s?.number != null && ARCANA_GUIDE[s.number]) lines.push({ term: `Soul: ${s.card}`, gist: ARCANA_GUIDE[s.number] });
  if (p && s)
    lines.push({
      term: "Together",
      gist:
        p.number === s.number
          ? "Both cards are the same, a rare doubling that strongly emphasizes this card's lesson."
          : `Your outward style (${p.card}) and your inner aim (${s.card}) work as a pair across your life.`,
    });
  return lines;
}

// --- Chinese BaZi ----------------------------------------------------------

const BAZI_ELEMENT: Record<string, string> = {
  wood: "growth-oriented and upright, expanding and planning toward the light",
  fire: "warm, expressive, and visible, here to energize and illuminate",
  earth: "grounding and dependable, here to stabilize, hold, and provide",
  metal: "clear, principled, and refined, here to cut to what matters",
  water: "adaptive, deep, and flowing, here to sense, connect, and move around obstacles",
};

function bazi(c: ComputedSystem): EnergyLine[] {
  const dm = val<{ element?: string; polarity?: string }>(c, "day-master");
  const animal = (val<{ animal?: string }>(c, "animal"))?.animal;
  const pillars = val<Record<string, { element?: string }>>(c, "pillars");
  const lines: EnergyLine[] = [];
  if (dm?.element) {
    const key = dm.polarity === "Yang" ? "in an active, outward key" : "in a receptive, inward key";
    lines.push({ term: `${dm.polarity} ${cap(dm.element)} day master`, gist: `Your core self is ${BAZI_ELEMENT[dm.element] ?? "your day master element"}, ${key}.` });
  }
  if (pillars) {
    const counts: Record<string, number> = {};
    for (const p of Object.values(pillars)) {
      const e = p.element ? cap(p.element) : "";
      if (e) counts[e] = (counts[e] ?? 0) + 1;
    }
    const bal = balanceText(counts);
    if (bal) lines.push({ term: "Across your pillars", gist: bal });
  }
  if (animal) lines.push({ term: `Year of the ${animal}`, gist: "The animal your birth year carries: your social, outward style." });
  return lines;
}

// --- Human Design ----------------------------------------------------------

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
  Lunar: "Take a full cycle before any major decision.",
};
const HD_DEFINITION: Record<string, string> = {
  None: "Fully open, you take your color from the room around you.",
  Single: "Your energy moves as one connected circuit. You are largely self-contained.",
  Split: "Two separate circuits look for a bridge, often through other people.",
  "Triple Split": "Three streams of definition; you weave several currents together.",
  "Quadruple Split": "Four streams; a complexity that rewards patience.",
};

function humanDesign(c: ComputedSystem): EnergyLine[] {
  const type = val<string>(c, "type");
  const strategy = disp(c, "strategy");
  const authority = val<string>(c, "authority");
  const profile = disp(c, "profile");
  const definition = val<string>(c, "definition");
  const centers = val<Record<string, boolean>>(c, "centers");
  const lines: EnergyLine[] = [];
  if (type) lines.push({ term: type, gist: HD_TYPE[type] ?? "Your energy type: how you are designed to engage." });
  if (strategy) lines.push({ term: "Strategy", gist: `${strategy}. Your way in, so life cooperates.` });
  if (authority) lines.push({ term: `${authority} authority`, gist: HD_AUTHORITY[authority] ?? "How you are designed to decide." });
  if (profile) lines.push({ term: `Profile ${profile}`, gist: "The roles you live out, conscious and unconscious, as you meet the world." });
  if (definition) lines.push({ term: `${definition} definition`, gist: HD_DEFINITION[definition] ?? "How your defined centers connect into circuits." });
  if (centers) {
    const on = Object.entries(centers).filter(([, v]) => v).map(([k]) => k);
    lines.push({
      term: `${on.length} of 9 centers defined`,
      gist: on.length ? `${on.join(", ")}. These are where your energy is consistent and reliable.` : "Fully open, a reflector of your surroundings.",
    });
  }
  return lines;
}

function dreamspell(c: ComputedSystem): EnergyLine[] {
  const seal = disp(c, "seal");
  const tone = disp(c, "tone");
  const oracle = disp(c, "oracle");
  const lines: EnergyLine[] = [];
  if (seal) lines.push({ term: seal, gist: "Your Dreamspell solar seal: the core archetype of your galactic signature." });
  if (tone) lines.push({ term: tone, gist: "The galactic tone: the role and rhythm your seal plays." });
  if (oracle) lines.push({ term: "Fifth-force oracle", gist: `Your supporting seals (${oracle}).` });
  lines.push({ term: "Good to know", gist: "Dreamspell is a modern reconstruction, shown for interest and kept out of the synthesis." });
  return lines;
}

function generic(c: ComputedSystem): EnergyLine[] {
  const corpus = interpretationsFor(c.meta.id, c.native).map((l) => ({ term: l.label, gist: l.text }));
  if (corpus.length) return corpus;
  return Object.values(c.native.factors)
    .slice(0, 5)
    .map((f) => ({ term: f.label, gist: String(f.display ?? f.value) }));
}
