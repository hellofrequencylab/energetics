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

// Our own plain-language descriptions of the four Activation-Sequence spheres.
// The per-gate Shadow/Gift/Siddhi contemplations are Richard Rudd's licensed
// corpus and are intentionally NOT reproduced — add them via your own license.
const SPHERES: { key: string; title: string; desc: string; from: "persSun" | "persEarth" | "desSun" | "desEarth" }[] = [
  { key: "lifesWork", title: "Life's Work", desc: "your core creative expression in the world", from: "persSun" },
  { key: "evolution", title: "Evolution", desc: "the central challenge that grows you", from: "persEarth" },
  { key: "radiance", title: "Radiance", desc: "what restores vitality when you're aligned", from: "desSun" },
  { key: "purpose", title: "Purpose", desc: "your deeper direction and contribution", from: "desEarth" },
];

export const engine: SystemEngine = {
  meta,
  compute(birth: BirthEvent, { ephemeris }: EngineDeps): NativeResult {
    const persInstant = toUtcInstant(birth);
    const persSun = ephemeris.positionsAt(persInstant).sun.longitude;
    const desInstant = designInstant(ephemeris, persInstant, persSun);
    const desSun = ephemeris.positionsAt(desInstant).sun.longitude;

    const lon = {
      persSun,
      persEarth: norm360(persSun + 180),
      desSun,
      desEarth: norm360(desSun + 180),
    };

    const factors: Record<string, NativeFactor> = {};
    for (const s of SPHERES) {
      const gl = gateLine(lon[s.from]);
      factors[s.key] = {
        key: s.key,
        label: s.title,
        value: { gate: gl.gate, line: gl.line },
        display: `Gate ${gl.gate}.${gl.line} — ${s.desc}`,
      };
    }
    factors.note = {
      key: "note",
      label: "Note",
      value: "corpus-licensed",
      display: "Activation Sequence gates shown; per-gate contemplations are the licensed Gene Keys corpus.",
    };

    return { systemId: meta.id, factors };
  },
};
