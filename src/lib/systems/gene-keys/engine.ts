import type { BirthEvent } from "@/lib/core/birth-event";
import type { EngineDeps, NativeFactor, NativeResult, SystemEngine, SystemMeta } from "@/lib/core/contracts";
import { toUtcInstant } from "@/lib/core/time";
import { norm360 } from "@/lib/core/zodiac";
// Reuses Human Design's gate-wheel DATA (not its engine) — the documented hard
// derivation (dependsOn: human-design).
import { GATE_WHEEL, WHEEL_START } from "../human-design/data";

export const meta: SystemMeta = {
  id: "gene-keys",
  displayName: "Gene Keys",
  lineage: "hybrid",
  requires: { time: true, place: true },
  derivedFrom: "ephemeris",
  dependsOn: ["human-design"],
  corpusVersion: "1",
};

const GATE_ARC = 360 / 64;
const LINE_ARC = GATE_ARC / 6;
const SOLAR_DAY = 0.9856473;

function gateLine(longitude: number): { gate: number; line: number } {
  const offset = norm360(longitude - WHEEL_START);
  const idx = Math.floor(offset / GATE_ARC) % 64;
  return { gate: GATE_WHEEL[idx], line: Math.min(6, Math.floor((offset - idx * GATE_ARC) / LINE_ARC) + 1) };
}

function designInstant(eph: EngineDeps["ephemeris"], persInstant: number, persSun: number): number {
  const target = norm360(persSun - 88);
  let t = persInstant - 88.5 * 86400000;
  for (let i = 0; i < 12; i++) {
    const sun = eph.positionsAt(t).sun.longitude;
    let d = norm360(sun - target);
    if (d > 180) d -= 360;
    if (Math.abs(d) < 1e-5) break;
    t -= (d / SOLAR_DAY) * 86400000;
  }
  return t;
}

/**
 * The Hologenetic Profile reads four planetary points at each of two moments:
 * personality (your birth) and design (when the Sun was 88° of arc earlier).
 * Earth is always the Sun + 180°. We compute the points the three sequences
 * draw from, then look up each one's gate and line on the shared wheel.
 *
 * We do NOT reproduce Richard Rudd's per-gate Shadow/Gift/Siddhi corpus. We only
 * compute the gate and line of each sphere (the same maths as Human Design) and
 * give each sphere our own plain-language description of what it points at.
 */
type PointKey =
  | "persSun" | "persEarth" | "persMoon" | "persVenus" | "persMars" | "persJupiter"
  | "desSun" | "desEarth" | "desMoon" | "desVenus" | "desMars" | "desJupiter";

interface Sphere {
  key: string;
  title: string;
  desc: string;
  sequence: "Activation" | "Venus" | "Pearl";
  from: PointKey;
}

// Sphere → source point. The Activation Sequence is the four prime gates of the
// Sun/Earth axis. The Venus Sequence (relationships, emotional patterning) and
// the Pearl Sequence (vocation, prosperity) draw from the inner planets.
const SPHERES: Sphere[] = [
  // Activation Sequence — your core genius and life direction.
  { key: "lifesWork", title: "Life's Work", desc: "your core creative expression in the world", sequence: "Activation", from: "persSun" },
  { key: "evolution", title: "Evolution", desc: "the central challenge that grows you", sequence: "Activation", from: "persEarth" },
  { key: "radiance", title: "Radiance", desc: "what restores vitality when you are aligned", sequence: "Activation", from: "desSun" },
  { key: "purpose", title: "Purpose", desc: "your deeper direction and contribution", sequence: "Activation", from: "desEarth" },
  // Venus Sequence — how you love, relate, and open the heart.
  { key: "attraction", title: "Attraction", desc: "the pattern that draws relationships toward you", sequence: "Venus", from: "desMoon" },
  { key: "iq", title: "IQ", desc: "how your mind learns and solves", sequence: "Venus", from: "desVenus" },
  { key: "eq", title: "EQ", desc: "how you feel, bond, and read others", sequence: "Venus", from: "persVenus" },
  { key: "sq", title: "SQ", desc: "the intuitive intelligence behind your choices", sequence: "Venus", from: "persMars" },
  { key: "core", title: "Core", desc: "the tender wound that, met, becomes your stability", sequence: "Venus", from: "desMars" },
  // Pearl Sequence — your gifts as they meet the world: work and prosperity.
  { key: "vocation", title: "Vocation", desc: "the work that fits you and lifts your prosperity", sequence: "Pearl", from: "persJupiter" },
  { key: "culture", title: "Culture", desc: "the wider circle and field you are here to serve", sequence: "Pearl", from: "desJupiter" },
  { key: "brand", title: "Pearl", desc: "the simple gift that opens flow when you stop trying", sequence: "Pearl", from: "desSun" },
];

export const engine: SystemEngine = {
  meta,
  compute(birth: BirthEvent, { ephemeris }: EngineDeps): NativeResult {
    const persInstant = toUtcInstant(birth);
    const pers = ephemeris.positionsAt(persInstant);
    const persSun = pers.sun.longitude;
    const desInstant = designInstant(ephemeris, persInstant, persSun);
    const des = ephemeris.positionsAt(desInstant);

    const lon: Record<PointKey, number> = {
      persSun,
      persEarth: norm360(persSun + 180),
      persMoon: pers.moon.longitude,
      persVenus: pers.venus.longitude,
      persMars: pers.mars.longitude,
      persJupiter: pers.jupiter.longitude,
      desSun: des.sun.longitude,
      desEarth: norm360(des.sun.longitude + 180),
      desMoon: des.moon.longitude,
      desVenus: des.venus.longitude,
      desMars: des.mars.longitude,
      desJupiter: des.jupiter.longitude,
    };

    const factors: Record<string, NativeFactor> = {};
    const bySeq: Record<string, string[]> = { Activation: [], Venus: [], Pearl: [] };
    for (const s of SPHERES) {
      const gl = gateLine(lon[s.from]);
      factors[s.key] = {
        key: s.key,
        label: s.title,
        value: { gate: gl.gate, line: gl.line, sequence: s.sequence },
        display: `Gate ${gl.gate}.${gl.line}: ${s.desc}`,
      };
      bySeq[s.sequence].push(`${s.title} ${gl.gate}.${gl.line}`);
    }

    // Roll-up summaries so a reader sees each sequence at a glance.
    factors.activationSequence = {
      key: "activationSequence",
      label: "Activation Sequence",
      value: bySeq.Activation,
      display: bySeq.Activation.join(", "),
    };
    factors.venusSequence = {
      key: "venusSequence",
      label: "Venus Sequence",
      value: bySeq.Venus,
      display: bySeq.Venus.join(", "),
    };
    factors.pearlSequence = {
      key: "pearlSequence",
      label: "Pearl Sequence",
      value: bySeq.Pearl,
      display: bySeq.Pearl.join(", "),
    };

    // Line resonance: the line numbers repeated across the prime four spheres
    // hint at the "keynote" of how you embody the gates (derived, not corpus).
    const primeLines = ["lifesWork", "evolution", "radiance", "purpose"]
      .map((k) => (factors[k].value as { line: number }).line);
    const lineCount = new Map<number, number>();
    for (const l of primeLines) lineCount.set(l, (lineCount.get(l) ?? 0) + 1);
    const keynoteLine = [...lineCount.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0][0];
    factors.keynoteLine = {
      key: "keynoteLine",
      label: "Keynote Line",
      value: keynoteLine,
      display: `Line ${keynoteLine}`,
    };

    factors.note = {
      key: "note",
      label: "Note",
      value: "corpus-licensed",
      display: "Sequence gates shown; per-gate Shadow, Gift, and Siddhi contemplations are the licensed Gene Keys corpus.",
    };

    return { systemId: meta.id, factors };
  },
};
