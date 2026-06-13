/**
 * Core contracts — the published interfaces that wire the layers together.
 *
 * Invariants enforced here (see architecture spec §1):
 *  - Engines are PURE: compute() is a deterministic function of
 *    (BirthEvent, ephemeris, corpusVersion). No I/O, randomness, clock, network.
 *  - Engines NEVER import each other. The registry is the only coupling point.
 *  - Adapters are SEPARATE from engines: native → ontology mapping is auditable
 *    and never lives inside the engine.
 *  - Provenance is first-class: every primitive records its source engine and
 *    what it was derived from, so synthesis can weight by independence.
 */
import type { BirthEvent, Precision } from "./birth-event";

export type Lineage = "traditional" | "modern-reconstruction" | "hybrid";

/** The primary computational source of a system — drives independence weighting. */
export type SourceKind = "ephemeris" | "date" | "name";

/** Controlled set of ontology axes (see lib/ontology/axes.ts). */
export type OntologyAxis = "element" | "polarity" | "theme" | "center" | "domain";

export interface SystemMeta {
  id: string; // 'western-tropical' | 'tzolkin' | ...
  displayName: string;
  lineage: Lineage;
  /** date is ALWAYS required; these gate time/place-dependent engines. */
  requires: { time: boolean; place: boolean };
  derivedFrom: SourceKind;
  /** engine ids this one is NOT independent of (shared or reused computation). */
  dependsOn: string[];
  corpusVersion: string;
}

/** A single native finding in a system's own vocabulary. */
export interface NativeFactor {
  key: string; // stable id, e.g. 'sun', 'rising', 'day-sign', 'life-path'
  label: string; // human label in the system's own language
  value: unknown; // native value (sign, gate, number, tone, ...)
  /** Optional human-readable rendering for UI; falls back to String(value). */
  display?: string;
}

/** System-specific result. The base guarantees a stable factors map. */
export interface NativeResult {
  systemId: string;
  factors: Record<string, NativeFactor>;
}

/** One ontology primitive emitted by an adapter from a native factor. */
export interface Primitive {
  axis: OntologyAxis;
  value: string; // controlled-vocabulary term (may be namespaced, e.g. "western:fire")
  weight: number; // 0..1 native salience
  source: string; // engine id that emitted it
  derivedFrom: SourceKind;
  native: { factorKey: string; raw: unknown };
}

export interface SystemEngine {
  meta: SystemMeta;
  compute(birth: BirthEvent, deps: EngineDeps): NativeResult;
}

export interface EngineDeps {
  ephemeris: EphemerisService;
}

/** Adapter is separate from the engine; mappings stay auditable. */
export interface SemanticAdapter {
  systemId: string;
  ontologyVersion: string;
  toPrimitives(native: NativeResult): Primitive[];
}

/** A fully-registered system: pure engine + separate adapter + metadata. */
export interface RegisteredSystem {
  engine: SystemEngine;
  adapter: SemanticAdapter;
  meta: SystemMeta;
}

// --- Ephemeris utility (consumed by all ephemeris-derived engines) ----------

/** Bodies the ephemeris resolves. South Node is derived (North + 180°). */
export type Body =
  | "sun"
  | "moon"
  | "mercury"
  | "venus"
  | "mars"
  | "jupiter"
  | "saturn"
  | "uranus"
  | "neptune"
  | "pluto"
  | "northNode"
  | "southNode";

export interface BodyLongitude {
  longitude: number; // ecliptic longitude 0-360°
  speed: number; // °/day; negative = retrograde
  retrograde: boolean;
}

export type PlanetaryLongitudes = Record<Body, BodyLongitude>;

export interface HouseData {
  system: string;
  cusps: number[]; // 12 cusp longitudes
  ascendant: number;
  midheaven: number;
}

export interface PositionOptions {
  /** Read positions in the sidereal zodiac (call setSiderealMode internally). */
  sidereal?: boolean;
}

/**
 * The ephemeris is a UTILITY, not a system — computed once per birth moment and
 * shared by every ephemeris-derived engine. Implementations are swappable
 * (Swiss Ephemeris primary; a pure-JS fallback could implement this interface).
 */
export interface EphemerisService {
  readonly version: string;
  /** utcInstant: ms since epoch. */
  positionsAt(utcInstant: number, opts?: PositionOptions): PlanetaryLongitudes;
  housesAt(utcInstant: number, lat: number, lng: number, system?: string): HouseData;
  /** Tropical→sidereal offset (degrees) for the given moment + ayanamsa. */
  ayanamsaAt(utcInstant: number): number;
}

export type { BirthEvent, Precision };
