import type { BirthEvent } from "@/lib/core/birth-event";
import type { EngineDeps, NativeResult, SystemEngine, SystemMeta } from "@/lib/core/contracts";
import { toUtcInstant } from "@/lib/core/time";
import { toSignPosition } from "@/lib/core/zodiac";

export const meta: SystemMeta = {
  id: "western-tropical",
  displayName: "Western (Tropical)",
  lineage: "traditional",
  requires: { time: true, place: true },
  derivedFrom: "ephemeris",
  dependsOn: [],
  corpusVersion: "1",
};

/** A luminary/angle placement in the tropical zodiac. */
export interface WesternPlacement {
  sign: string;
  signIndex: number;
  longitude: number;
  degreesInSign: number;
}

/**
 * Phase 1 minimal output: Sun, Moon, Rising (the three pillars of a Western
 * reading). Pure: derives everything from the shared ephemeris.
 */
export const engine: SystemEngine = {
  meta,
  compute(birth: BirthEvent, { ephemeris }: EngineDeps): NativeResult {
    const instant = toUtcInstant(birth);
    const positions = ephemeris.positionsAt(instant);
    const houses = ephemeris.housesAt(instant, birth.place!.lat, birth.place!.lng);

    const placement = (longitude: number): WesternPlacement => {
      const sp = toSignPosition(longitude);
      return { sign: sp.sign.name, signIndex: sp.sign.index, longitude, degreesInSign: sp.degreesInSign };
    };

    const sun = placement(positions.sun.longitude);
    const moon = placement(positions.moon.longitude);
    const rising = placement(houses.ascendant);

    return {
      systemId: meta.id,
      factors: {
        sun: { key: "sun", label: "Sun", value: sun, display: `${toSignPosition(sun.longitude).formatted}` },
        moon: { key: "moon", label: "Moon", value: moon, display: `${toSignPosition(moon.longitude).formatted}` },
        rising: { key: "rising", label: "Rising", value: rising, display: `${toSignPosition(rising.longitude).formatted}` },
      },
    };
  },
};
