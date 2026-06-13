import { describe, expect, it } from "vitest";
import { getEphemeris } from "@/lib/core/ephemeris";
import { engine } from "./engine";
import type { VedicPlacement } from "./engine";

const res = engine.compute(
  { id: "t", date: "1879-03-14", time: "11:30", place: { lat: 48.4011, lng: 9.9876, tz: "Europe/Berlin" }, precision: "date-time-place" },
  { ephemeris: getEphemeris() },
);

describe("vedic-jyotish (deepened)", () => {
  it("computes all 9 grahas + lagna", () => {
    for (const g of ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "rahu", "ketu"]) {
      expect(res.factors[g]).toBeDefined();
    }
    expect(res.factors.lagna).toBeDefined();
  });

  it("assigns each graha a whole-sign house 1-12 and a nakshatra", () => {
    for (const g of ["sun", "moon", "saturn", "rahu", "ketu"]) {
      const p = res.factors[g].value as VedicPlacement;
      expect(p.house).toBeGreaterThanOrEqual(1);
      expect(p.house).toBeLessThanOrEqual(12);
      expect(typeof p.nakshatra).toBe("string");
    }
  });

  it("places Rahu and Ketu in opposite signs (6 apart)", () => {
    const rahu = res.factors.rahu.value as VedicPlacement;
    const ketu = res.factors.ketu.value as VedicPlacement;
    expect((rahu.signIndex + 6) % 12).toBe(ketu.signIndex);
  });
});
