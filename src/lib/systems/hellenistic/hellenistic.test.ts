import { describe, expect, it } from "vitest";
import { getEphemeris } from "@/lib/core/ephemeris";
import { engine } from "./engine";

const res = engine.compute(
  { id: "t", date: "1879-03-14", time: "11:30", place: { lat: 48.4011, lng: 9.9876, tz: "Europe/Berlin" }, precision: "date-time-place" },
  { ephemeris: getEphemeris() },
);

describe("hellenistic (lite)", () => {
  it("reports a sect and the matching sect light", () => {
    expect(["Day", "Night"]).toContain(res.factors.sect.value);
    const light = res.factors["sect-light"].value;
    expect(res.factors.sect.value === "Day" ? "Sun" : "Moon").toBe(light);
  });
  it("names a classical chart ruler and a Lot of Fortune sign", () => {
    expect(["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"]).toContain(
      res.factors["chart-ruler"].value,
    );
    expect((res.factors.fortune.value as { sign: string }).sign).toBeTruthy();
  });
});
