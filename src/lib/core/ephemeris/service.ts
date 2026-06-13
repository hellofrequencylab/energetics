/**
 * EphemerisService interface (spec §8). The interface lives here so engines
 * import only the contract; concrete implementations are swappable.
 *
 * Primary impl: ./swisseph.ts (Swiss Ephemeris, native, highest accuracy).
 * A pure-JS fallback (e.g. astronomy-engine) for serverless paths can implement
 * this same interface — see ./index.ts for selection.
 */
export type {
  EphemerisService,
  PlanetaryLongitudes,
  BodyLongitude,
  HouseData,
  PositionOptions,
  Body,
} from "../contracts";
