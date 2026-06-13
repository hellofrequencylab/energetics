import type { BirthEvent } from "@/lib/core/birth-event";
import type { EngineDeps, NativeFactor, NativeResult, SystemEngine, SystemMeta } from "@/lib/core/contracts";
import { toUtcInstant } from "@/lib/core/time";
import { norm360 } from "@/lib/core/zodiac";
import {
  CENTERS,
  CENTER_GATES,
  CHANNELS,
  GATE_CENTER,
  GATE_WHEEL,
  MOTORS,
  WHEEL_START,
  type CenterId,
} from "./data";

export const meta: SystemMeta = {
  id: "human-design",
  displayName: "Human Design",
  lineage: "hybrid",
  requires: { time: true, place: true },
  derivedFrom: "ephemeris",
  dependsOn: [],
  corpusVersion: "1",
};

const GATE_ARC = 360 / 64; // 5.625°
const LINE_ARC = GATE_ARC / 6; // 0.9375°
const SOLAR_DAY = 0.9856473; // °/day mean Sun motion

export interface Activation {
  body: string;
  side: "personality" | "design";
  gate: number;
  line: number;
}

export interface HumanDesignData {
  type: string;
  strategy: string;
  authority: string;
  profile: string;
  definition: string;
  centers: Record<CenterId, boolean>;
  channels: string[];
  incarnationCross: number[]; // [persSun, persEarth, designSun, designEarth]
  activations: Activation[];
}

export function gateLine(longitude: number): { gate: number; line: number } {
  const offset = norm360(longitude - WHEEL_START);
  const idx = Math.floor(offset / GATE_ARC) % 64;
  const line = Math.floor((offset - idx * GATE_ARC) / LINE_ARC) + 1;
  return { gate: GATE_WHEEL[idx], line: Math.min(6, line) };
}

/** Bodies used by HD: 13 = 12 ephemeris points + Earth (Sun + 180°). */
function chartLongitudes(eph: EngineDeps["ephemeris"], instant: number): { body: string; lon: number }[] {
  const p = eph.positionsAt(instant);
  return [
    { body: "Sun", lon: p.sun.longitude },
    { body: "Earth", lon: norm360(p.sun.longitude + 180) },
    { body: "Moon", lon: p.moon.longitude },
    { body: "North Node", lon: p.northNode.longitude },
    { body: "South Node", lon: p.southNode.longitude },
    { body: "Mercury", lon: p.mercury.longitude },
    { body: "Venus", lon: p.venus.longitude },
    { body: "Mars", lon: p.mars.longitude },
    { body: "Jupiter", lon: p.jupiter.longitude },
    { body: "Saturn", lon: p.saturn.longitude },
    { body: "Uranus", lon: p.uranus.longitude },
    { body: "Neptune", lon: p.neptune.longitude },
    { body: "Pluto", lon: p.pluto.longitude },
  ];
}

/** Solve for the Design instant: when the Sun was 88° of arc earlier. */
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

/** Union-find over defined centers connected by defined channels. */
function components(defined: Set<CenterId>, definedChannels: [number, number][]): number {
  const parent = new Map<CenterId, CenterId>([...defined].map((c) => [c, c]));
  const find = (c: CenterId): CenterId => {
    let r = c;
    while (parent.get(r) !== r) r = parent.get(r)!;
    return r;
  };
  const union = (a: CenterId, b: CenterId) => parent.set(find(a), find(b));
  for (const [g1, g2] of definedChannels) union(GATE_CENTER[g1], GATE_CENTER[g2]);
  return new Set([...defined].map(find)).size;
}

/** Is the Throat connected (through defined channels) to a motor center? */
function motorToThroat(defined: Set<CenterId>, definedChannels: [number, number][]): boolean {
  if (!defined.has("Throat")) return false;
  const adj = new Map<CenterId, CenterId[]>();
  for (const [g1, g2] of definedChannels) {
    const a = GATE_CENTER[g1];
    const b = GATE_CENTER[g2];
    (adj.get(a) ?? adj.set(a, []).get(a)!).push(b);
    (adj.get(b) ?? adj.set(b, []).get(b)!).push(a);
  }
  const seen = new Set<CenterId>(["Throat"]);
  const stack: CenterId[] = ["Throat"];
  while (stack.length) {
    const cur = stack.pop()!;
    if (MOTORS.includes(cur)) return true;
    for (const n of adj.get(cur) ?? []) {
      if (!seen.has(n)) {
        seen.add(n);
        stack.push(n);
      }
    }
  }
  return false;
}

export const engine: SystemEngine = {
  meta,
  compute(birth: BirthEvent, { ephemeris }: EngineDeps): NativeResult {
    const persInstant = toUtcInstant(birth);
    const persLon = chartLongitudes(ephemeris, persInstant);
    const persSun = persLon[0].lon;
    const desInstant = designInstant(ephemeris, persInstant, persSun);
    const desLon = chartLongitudes(ephemeris, desInstant);

    const activations: Activation[] = [
      ...persLon.map((b) => ({ body: b.body, side: "personality" as const, ...gateLine(b.lon) })),
      ...desLon.map((b) => ({ body: b.body, side: "design" as const, ...gateLine(b.lon) })),
    ];

    const activeGates = new Set(activations.map((a) => a.gate));
    const definedChannels = CHANNELS.filter(([a, b]) => activeGates.has(a) && activeGates.has(b));

    const defined = new Set<CenterId>();
    for (const [a, b] of definedChannels) {
      defined.add(GATE_CENTER[a]);
      defined.add(GATE_CENTER[b]);
    }

    const sacral = defined.has("Sacral");
    const m2t = motorToThroat(defined, definedChannels);
    let type: string;
    if (defined.size === 0) type = "Reflector";
    else if (sacral) type = m2t ? "Manifesting Generator" : "Generator";
    else if (m2t) type = "Manifestor";
    else type = "Projector";

    const STRATEGY: Record<string, string> = {
      Manifestor: "Inform, then act",
      Generator: "Wait to respond",
      "Manifesting Generator": "Respond, then inform",
      Projector: "Wait for the invitation",
      Reflector: "Wait a lunar cycle",
    };

    let authority: string;
    if (type === "Reflector") authority = "Lunar";
    else if (defined.has("SolarPlexus")) authority = "Emotional";
    else if (defined.has("Sacral")) authority = "Sacral";
    else if (defined.has("Spleen")) authority = "Splenic";
    else if (defined.has("Heart")) authority = "Ego";
    else if (defined.has("G")) authority = "Self-Projected";
    else authority = "Mental (outer)";

    const persSunLine = activations.find((a) => a.body === "Sun" && a.side === "personality")!.line;
    const desSunLine = activations.find((a) => a.body === "Sun" && a.side === "design")!.line;
    const profile = `${persSunLine}/${desSunLine}`;

    const compCount = components(defined, definedChannels);
    const definition = ["None", "Single", "Split", "Triple Split", "Quadruple Split"][compCount] ?? "Complex";

    const centersRecord = Object.fromEntries(CENTERS.map((c) => [c, defined.has(c)])) as Record<CenterId, boolean>;
    const g = (body: string, side: "personality" | "design") =>
      activations.find((a) => a.body === body && a.side === side)!.gate;
    const incarnationCross = [g("Sun", "personality"), g("Earth", "personality"), g("Sun", "design"), g("Earth", "design")];

    const data: HumanDesignData = {
      type,
      strategy: STRATEGY[type],
      authority,
      profile,
      definition,
      centers: centersRecord,
      channels: definedChannels.map(([a, b]) => `${a}-${b}`),
      incarnationCross,
      activations,
    };

    const factors: Record<string, NativeFactor> = {
      type: { key: "type", label: "Type", value: type, display: type },
      strategy: { key: "strategy", label: "Strategy", value: data.strategy, display: data.strategy },
      authority: { key: "authority", label: "Authority", value: authority, display: authority },
      profile: { key: "profile", label: "Profile", value: profile, display: profile },
      definition: { key: "definition", label: "Definition", value: definition, display: definition },
      centers: {
        key: "centers",
        label: "Defined Centers",
        value: centersRecord,
        display: CENTERS.filter((c) => defined.has(c)).join(", ") || "none (Reflector)",
      },
      cross: {
        key: "cross",
        label: "Incarnation Cross",
        value: incarnationCross,
        display: `Gates ${incarnationCross[0]}/${incarnationCross[1]} | ${incarnationCross[2]}/${incarnationCross[3]}`,
      },
      note: {
        key: "note",
        label: "Note",
        value: "validation-pending",
        display: "⚠ Tables compiled from standard references; pending validation against a trusted HD calculator.",
      },
    };

    return { systemId: meta.id, factors };
  },
};

export { CENTER_GATES };
