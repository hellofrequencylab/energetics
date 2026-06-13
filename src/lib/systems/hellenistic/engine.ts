import type { BirthEvent } from "@/lib/core/birth-event";
import type { EngineDeps, NativeResult, SystemEngine, SystemMeta } from "@/lib/core/contracts";
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

/** Classical domicile (sign) rulers — the seven visible planets. */
const DOMICILE = [
  "Mars", "Venus", "Mercury", "Moon", "Sun", "Mercury",
  "Venus", "Mars", "Jupiter", "Saturn", "Saturn", "Jupiter",
];

function houseOf(longitude: number, cusps: number[]): number {
  const lon = norm360(longitude);
  for (let i = 0; i < 12; i++) {
    const span = norm360(cusps[(i + 1) % 12] - cusps[i]);
    if (norm360(lon - cusps[i]) < span) return i + 1;
  }
  return 12;
}

/**
 * A verifiable Hellenistic "lite": sect (day/night), the sect light, the Lot of
 * Fortune (sect-aware formula), and the chart ruler (domicile lord of the Asc).
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

    const fortuneLon = isDay
      ? norm360(houses.ascendant + pos.moon.longitude - pos.sun.longitude)
      : norm360(houses.ascendant + pos.sun.longitude - pos.moon.longitude);
    const fortune = toSignPosition(fortuneLon);
    const ascSign = toSignPosition(houses.ascendant).sign;
    const chartRuler = DOMICILE[ascSign.index];

    return {
      systemId: meta.id,
      factors: {
        sect: { key: "sect", label: "Sect", value: isDay ? "Day" : "Night", display: isDay ? "Day chart" : "Night chart" },
        "sect-light": { key: "sect-light", label: "Sect Light", value: isDay ? "Sun" : "Moon", display: isDay ? "Sun" : "Moon" },
        fortune: {
          key: "fortune",
          label: "Lot of Fortune",
          value: { sign: fortune.sign.name, signIndex: fortune.sign.index, longitude: fortuneLon },
          display: fortune.formatted,
        },
        "chart-ruler": {
          key: "chart-ruler",
          label: "Chart Ruler",
          value: chartRuler,
          display: `${chartRuler} (ruler of ${ascSign.name} Asc)`,
        },
      },
    };
  },
};
