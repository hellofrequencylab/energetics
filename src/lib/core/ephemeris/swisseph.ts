/**
 * Swiss Ephemeris implementation of EphemerisService.
 *
 * The ONLY module that talks to the native `sweph` binding. NODE RUNTIME ONLY
 * (native N-API addon — cannot run on the Edge runtime).
 *
 * Ephemeris data: if SE_EPHE_PATH points at a directory of .se1 files, full
 * sub-arcsecond precision is used; otherwise sweph falls back to the built-in
 * Moshier ephemeris (~1 arcsec for modern dates), which is fine for a baseline.
 */
import * as sweph from "sweph";
import type {
  BodyLongitude,
  CoreBody,
  EphemerisService,
  HouseData,
  PlanetaryLongitudes,
  PositionOptions,
} from "../contracts";
import { norm360 } from "../zodiac";
import { utcInstantToJulianDay } from "../time";

const C = sweph.constants;
const ERR = -1;

let initialized = false;
function init(): void {
  if (initialized) return;
  if (process.env.SE_EPHE_PATH) sweph.set_ephe_path(process.env.SE_EPHE_PATH);
  initialized = true;
}

/** sweph body ids for the always-resolvable core. South Node is derived. */
const BODY_IDS: Record<Exclude<CoreBody, "southNode">, number> = {
  sun: C.SE_SUN,
  moon: C.SE_MOON,
  mercury: C.SE_MERCURY,
  venus: C.SE_VENUS,
  mars: C.SE_MARS,
  jupiter: C.SE_JUPITER,
  saturn: C.SE_SATURN,
  uranus: C.SE_URANUS,
  neptune: C.SE_NEPTUNE,
  pluto: C.SE_PLUTO,
  northNode: C.SE_TRUE_NODE, // §8: defaulting to true node
};

const CHIRON_ID = C.SE_CHIRON;

class SwissEphemerisService implements EphemerisService {
  readonly version: string;

  constructor() {
    init();
    this.version = `Swiss Ephemeris (sweph) ${sweph.version()}${
      process.env.SE_EPHE_PATH ? "" : " [Moshier]"
    }`;
  }

  positionsAt(utcInstant: number, opts: PositionOptions = {}): PlanetaryLongitudes {
    const jd = utcInstantToJulianDay(utcInstant);
    let flags = C.SEFLG_SWIEPH | C.SEFLG_SPEED;
    if (opts.sidereal) {
      sweph.set_sid_mode(C.SE_SIDM_LAHIRI, 0, 0); // §12: Lahiri ayanamsa
      flags |= C.SEFLG_SIDEREAL;
    }

    const result = {} as PlanetaryLongitudes;
    for (const body of Object.keys(BODY_IDS) as Exclude<CoreBody, "southNode">[]) {
      result[body] = this.bodyAt(jd, BODY_IDS[body], flags);
    }
    // Derive South Node opposite the North Node.
    const nn = result.northNode;
    result.southNode = { ...nn, longitude: norm360(nn.longitude + 180) };

    // Chiron is optional: it needs the seas_*.se1 data file and is unavailable
    // under the Moshier fallback — omit it cleanly rather than throwing.
    try {
      result.chiron = this.bodyAt(jd, CHIRON_ID, flags);
    } catch {
      /* Chiron unavailable without ephemeris data files. */
    }
    return result;
  }

  private bodyAt(jd: number, id: number, flags: number): BodyLongitude {
    const res = sweph.calc_ut(jd, id, flags);
    if (res.flag === ERR) throw new Error(`Ephemeris calc failed: ${res.error}`);
    const [longitude, , , speed] = res.data;
    return { longitude: norm360(longitude), speed, retrograde: speed < 0 };
  }

  housesAt(utcInstant: number, lat: number, lng: number, system = "W"): HouseData {
    const jd = utcInstantToJulianDay(utcInstant);
    const res = sweph.houses(jd, lat, lng, system); // §12 default: "W" = Whole Sign
    if (res.flag === ERR) throw new Error(`House calculation failed for system ${system}`);
    const { houses: cusps, points } = res.data;
    return {
      system,
      cusps: cusps.map(norm360),
      ascendant: norm360(points[0]),
      midheaven: norm360(points[1]),
    };
  }

  ayanamsaAt(utcInstant: number): number {
    const jd = utcInstantToJulianDay(utcInstant);
    sweph.set_sid_mode(C.SE_SIDM_LAHIRI, 0, 0);
    const res = sweph.get_ayanamsa_ex_ut(jd, C.SEFLG_SWIEPH);
    return typeof res === "number" ? res : res.data;
  }
}

let singleton: SwissEphemerisService | null = null;

/** Get the process-wide Swiss Ephemeris service (memoized). */
export function swissEphemeris(): EphemerisService {
  if (!singleton) singleton = new SwissEphemerisService();
  return singleton;
}
