import { describe, expect, it } from "vitest";
import { getEphemeris } from "@/lib/core/ephemeris";
import { engine as western } from "@/lib/systems/western-tropical/engine";
import { SIGNS } from "@/lib/core/zodiac";
import { computeTransits } from "./index";

const natal = western.compute(
  { id: "t", date: "1990-06-15", time: "12:00", place: { lat: 51.5074, lng: -0.1278, tz: "Europe/London" }, precision: "date-time-place" },
  { ephemeris: getEphemeris() },
);

const signNames = SIGNS.map((s) => s.name);

describe("transits", () => {
  it("reports the transiting Sun's sign for a fixed date (2020-03-25 → Aries)", () => {
    const t = computeTransits(natal, "2020-03-25T12:00:00Z");
    expect(t.season.sunSign).toBe("Aries");
    expect(signNames).toContain(t.season.moonSign);
  });

  it("returns at most 12 transit hits with valid aspect shape", () => {
    const t = computeTransits(natal, "2020-03-25T12:00:00Z");
    expect(t.hits.length).toBeLessThanOrEqual(12);
    for (const h of t.hits) {
      expect(["conjunction", "opposition", "trine", "square", "sextile"]).toContain(h.aspect);
      expect(typeof h.applying).toBe("boolean");
    }
  });
});
