import type { EphemerisService } from "../contracts";
import { swissEphemeris } from "./swisseph";

/**
 * Select the ephemeris implementation. Swiss Ephemeris is primary; a pure-JS
 * fallback (astronomy-engine) could be wired here for serverless paths where the
 * native binding is awkward — implement EphemerisService and branch on an env
 * flag. Engines never know which is running.
 */
export function getEphemeris(): EphemerisService {
  return swissEphemeris();
}

export type { EphemerisService } from "../contracts";
