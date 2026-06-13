import { describe, expect, it } from "vitest";
import { intake } from "@/lib/core/birth-event";
import { computeChart } from "@/lib/compute";
import { computeSynastry } from "./index";

const personA = computeChart(
  intake({ name: "A", date: "1990-06-15", time: "12:00", place: { lat: 51.5074, lng: -0.1278, tz: "Europe/London" } }).event,
).computations;
const personB = computeChart(
  intake({ name: "B", date: "1988-11-02", time: "08:30", place: { lat: 40.7128, lng: -74.006, tz: "America/New_York" } }).event,
).computations;

describe("synastry", () => {
  it("a chart compared with itself shows a Sun–Sun conjunction at ~0°", () => {
    const self = computeSynastry(personA, personA);
    const sunSun = self.crossAspects.find((c) => c.a === "Sun" && c.b === "Sun");
    expect(sunSun?.aspect).toBe("conjunction");
    expect(sunSun?.orb).toBeLessThan(0.5);
  });

  it("a chart compared with itself shares all of its emphases", () => {
    const self = computeSynastry(personA, personA);
    expect(self.sharedEmphases.length).toBeGreaterThan(0);
  });

  it("two different people return well-formed cross-aspects and emphases", () => {
    const syn = computeSynastry(personA, personB);
    expect(Array.isArray(syn.crossAspects)).toBe(true);
    for (const c of syn.crossAspects) {
      expect(["conjunction", "opposition", "trine", "square", "sextile"]).toContain(c.aspect);
    }
    for (const t of syn.complementaryTensions) {
      expect(t.aValue).not.toBe(t.bValue);
    }
  });
});
