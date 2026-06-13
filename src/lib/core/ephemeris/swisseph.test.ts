import { describe, expect, it } from "vitest";
import { gregorianToJulianDay } from "@/lib/core/time";
import { toSignPosition } from "@/lib/core/zodiac";
import { swissEphemeris } from "./swisseph";

const J2000 = Date.UTC(2000, 0, 1, 12, 0, 0); // 2000-01-01 12:00 UTC

describe("time → Julian Day", () => {
  it("matches the J2000.0 epoch", () => {
    expect(gregorianToJulianDay(2000, 1, 1, 12)).toBeCloseTo(2451545.0, 6);
  });
});

describe("SwissEphemerisService", () => {
  const eph = swissEphemeris();

  it("places the Sun near 280.4° (≈10° Capricorn) at J2000", () => {
    const sun = eph.positionsAt(J2000).sun;
    expect(sun.longitude).toBeCloseTo(280.37, 1);
    expect(toSignPosition(sun.longitude).sign.name).toBe("Capricorn");
  });

  it("derives the South Node opposite the North Node", () => {
    const pos = eph.positionsAt(J2000);
    const sep = Math.abs(pos.northNode.longitude - pos.southNode.longitude) % 360;
    expect(Math.min(sep, 360 - sep)).toBeCloseTo(180, 6);
  });

  it("returns a Lahiri ayanamsa around 23.85° at J2000", () => {
    const ayan = eph.ayanamsaAt(J2000);
    expect(ayan).toBeGreaterThan(23);
    expect(ayan).toBeLessThan(24.5);
  });

  it("computes whole-sign houses whose cusps fall on sign boundaries", () => {
    const houses = eph.housesAt(J2000, 51.5074, -0.1278, "W");
    expect(houses.cusps).toHaveLength(12);
    for (const cusp of houses.cusps) expect(cusp % 30).toBeCloseTo(0, 6);
  });
});
