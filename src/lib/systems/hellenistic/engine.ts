import type { BirthEvent } from "@/lib/core/birth-event";
import type { EngineDeps, NativeResult, NativeFactor, SystemEngine, SystemMeta } from "@/lib/core/contracts";
import { toUtcInstant } from "@/lib/core/time";
import { norm360, toSignPosition } from "@/lib/core/zodiac";

export const meta: SystemMeta = {
  id: "hellenistic",
  displayName: "Hellenistic Astrology",
  lineage: "traditional",
  requires: { time: true, place: true },
  derivedFrom: "ephemeris",
  // Shares the same ephemeris computation as Western — collapsed into one
  // ephemeris voice in synthesis.
  dependsOn: ["western-tropical"],
  corpusVersion: "1",
};

/** Classical domicile (sign) rulers — the seven visible planets. 0 = Aries. */
const DOMICILE = [
  "Mars", "Venus", "Mercury", "Moon", "Sun", "Mercury",
  "Venus", "Mars", "Jupiter", "Saturn", "Saturn", "Jupiter",
];

/**
 * Triplicity (element) lords in the Dorothean scheme: a ruler by day, one by
 * night, and a participating ruler shared across each element's trine. The
 * condition of the sect light's triplicity lords was a core Hellenistic measure
 * of the arc and quality of a life.
 */
const TRIPLICITY: Record<string, { day: string; night: string; partner: string }> = {
  fire: { day: "Sun", night: "Jupiter", partner: "Saturn" },
  earth: { day: "Venus", night: "Moon", partner: "Mars" },
  air: { day: "Saturn", night: "Mercury", partner: "Jupiter" },
  water: { day: "Venus", night: "Mars", partner: "Moon" },
};

/**
 * Decennial / firdaria style time-lord opening planet. The chronocrator that
 * governs the first period of life depends on sect: by day the sequence opens
 * with the Sun, by night with the Moon (the classical Persian firdaria order).
 * Purely natal and deterministic, so it stays inside a pure engine.
 */
function firstTimeLord(isDay: boolean): string {
  return isDay ? "Sun" : "Moon";
}

function houseOf(longitude: number, cusps: number[]): number {
  const lon = norm360(longitude);
  for (let i = 0; i < 12; i++) {
    const span = norm360(cusps[(i + 1) % 12] - cusps[i]);
    if (norm360(lon - cusps[i]) < span) return i + 1;
  }
  return 12;
}

const ANGULAR = new Set([1, 4, 7, 10]);
const SUCCEDENT = new Set([2, 5, 8, 11]);
function angularity(house: number): string {
  if (ANGULAR.has(house)) return "angular";
  if (SUCCEDENT.has(house)) return "succedent";
  return "cadent";
}

/**
 * A verifiable Hellenistic reading: sect (day/night), the sect light and its
 * angularity and triplicity lords, the Lots of Fortune and Spirit (both
 * sect-aware), the chart ruler (domicile lord of the Ascendant), the lord of
 * Fortune, the benefic and malefic of the sect, and the opening time lord.
 */
export const engine: SystemEngine = {
  meta,
  compute(birth: BirthEvent, { ephemeris }: EngineDeps): NativeResult {
    const instant = toUtcInstant(birth);
    const pos = ephemeris.positionsAt(instant);
    const houses = ephemeris.housesAt(instant, birth.place!.lat, birth.place!.lng);

    // Day chart when the Sun is above the horizon (houses 7–12).
    const sunHouse = houseOf(pos.sun.longitude, houses.cusps);
    const isDay = sunHouse >= 7 && sunHouse <= 12;

    // Lots. Fortune is the lunar lot (Moon's distance from Sun, cast from Asc);
    // Spirit is the solar lot (the reverse). Both flip arc by sect.
    const fortuneLon = isDay
      ? norm360(houses.ascendant + pos.moon.longitude - pos.sun.longitude)
      : norm360(houses.ascendant + pos.sun.longitude - pos.moon.longitude);
    const spiritLon = isDay
      ? norm360(houses.ascendant + pos.sun.longitude - pos.moon.longitude)
      : norm360(houses.ascendant + pos.moon.longitude - pos.sun.longitude);
    const fortune = toSignPosition(fortuneLon);
    const spirit = toSignPosition(spiritLon);

    const ascSign = toSignPosition(houses.ascendant).sign;
    const chartRuler = DOMICILE[ascSign.index];

    // The sect light: the luminary that rules the chart's sect. Its sign,
    // element, house, and angularity matter to the whole reading.
    const lightLon = isDay ? pos.sun.longitude : pos.moon.longitude;
    const lightSign = toSignPosition(lightLon).sign;
    const lightHouse = houseOf(lightLon, houses.cusps);
    const trip = TRIPLICITY[lightSign.element];
    const tripActive = isDay ? trip.day : trip.night;

    // Benefic and malefic of the sect: the planet of each kind that matches the
    // chart's sect is the helpful or the more bearable one. By day Jupiter is the
    // benefic of sect and Saturn the malefic of sect; by night Venus and Mars.
    const beneficOfSect = isDay ? "Jupiter" : "Venus";
    const maleficOfSect = isDay ? "Saturn" : "Mars";

    const factors: Record<string, NativeFactor> = {
      sect: { key: "sect", label: "Sect", value: isDay ? "Day" : "Night", display: isDay ? "Day chart" : "Night chart" },
      "sect-light": {
        key: "sect-light",
        label: "Sect Light",
        value: isDay ? "Sun" : "Moon",
        display: `${isDay ? "Sun" : "Moon"} in ${lightSign.name} (${angularity(lightHouse)}, ${lightHouse}H)`,
      },
      "sect-light-detail": {
        key: "sect-light-detail",
        label: "Sect Light Placement",
        value: { light: isDay ? "Sun" : "Moon", sign: lightSign.name, signIndex: lightSign.index, house: lightHouse, angularity: angularity(lightHouse) },
        display: `${lightSign.name}, ${angularity(lightHouse)} (${lightHouse}H)`,
      },
      "triplicity-lords": {
        key: "triplicity-lords",
        label: "Triplicity Lords",
        value: { element: lightSign.element, day: trip.day, night: trip.night, partner: trip.partner, active: tripActive },
        display: `${tripActive} / ${isDay ? trip.night : trip.day} / ${trip.partner}`,
      },
      fortune: {
        key: "fortune",
        label: "Lot of Fortune",
        value: { sign: fortune.sign.name, signIndex: fortune.sign.index, longitude: fortuneLon, ruler: DOMICILE[fortune.sign.index] },
        display: `${fortune.formatted} (lord ${DOMICILE[fortune.sign.index]})`,
      },
      spirit: {
        key: "spirit",
        label: "Lot of Spirit",
        value: { sign: spirit.sign.name, signIndex: spirit.sign.index, longitude: spiritLon, ruler: DOMICILE[spirit.sign.index] },
        display: `${spirit.formatted} (lord ${DOMICILE[spirit.sign.index]})`,
      },
      "chart-ruler": {
        key: "chart-ruler",
        label: "Chart Ruler",
        value: chartRuler,
        display: `${chartRuler} (ruler of ${ascSign.name} Asc)`,
      },
      "sect-benefic": {
        key: "sect-benefic",
        label: "Benefic of Sect",
        value: beneficOfSect,
        display: `${beneficOfSect} (helps most)`,
      },
      "sect-malefic": {
        key: "sect-malefic",
        label: "Malefic of Sect",
        value: maleficOfSect,
        display: `${maleficOfSect} (more bearable)`,
      },
      "time-lord": {
        key: "time-lord",
        label: "Opening Time Lord",
        value: { lord: firstTimeLord(isDay), basis: isDay ? "day" : "night" },
        display: `${firstTimeLord(isDay)} opens the sequence`,
      },
    };

    return { systemId: meta.id, factors };
  },
};
