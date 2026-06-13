import { describe, expect, it } from "vitest";
import { getEphemeris } from "@/lib/core/ephemeris";
import { engine } from "./engine";

const res = engine.compute(
  { id: "t", date: "1879-03-14", time: "11:30", place: { lat: 48.4011, lng: 9.9876, tz: "Europe/Berlin" }, precision: "date-time-place" },
  { ephemeris: getEphemeris() },
);

describe("gene keys (activation sequence)", () => {
  it("computes four spheres as gates 1–64 with lines 1–6", () => {
    for (const key of ["lifesWork", "evolution", "radiance", "purpose"]) {
      const v = res.factors[key].value as { gate: number; line: number };
      expect(v.gate).toBeGreaterThanOrEqual(1);
      expect(v.gate).toBeLessThanOrEqual(64);
      expect(v.line).toBeGreaterThanOrEqual(1);
      expect(v.line).toBeLessThanOrEqual(6);
    }
  });
});
