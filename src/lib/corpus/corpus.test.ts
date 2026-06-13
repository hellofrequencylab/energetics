import { describe, expect, it } from "vitest";
import { getEphemeris } from "@/lib/core/ephemeris";
import { engine as western } from "@/lib/systems/western-tropical/engine";
import { engine as numerology } from "@/lib/systems/numerology-pythagorean/engine";
import { SIGNS } from "@/lib/core/zodiac";
import { interpretationsFor, lookup } from "./index";
import { ARCANA_GUIDE, DAYSIGN_GUIDE, NUMBER_GUIDE, PLANET_GUIDE, SIGN_GUIDE, TONE_GUIDE } from "./data";

describe("corpus coverage", () => {
  it("covers all 12 signs", () => {
    for (const s of SIGNS) expect(SIGN_GUIDE[s.name]).toBeTruthy();
  });
  it("covers core numbers, tones, day-signs, arcana", () => {
    for (const n of [1, 9, 11, 22, 33]) expect(NUMBER_GUIDE[n]).toBeTruthy();
    for (let t = 1; t <= 13; t++) expect(TONE_GUIDE[t]).toBeTruthy();
    expect(Object.keys(DAYSIGN_GUIDE)).toHaveLength(20);
    expect(Object.keys(ARCANA_GUIDE)).toHaveLength(22);
    expect(PLANET_GUIDE.sun).toBeTruthy();
  });
});

describe("lookup", () => {
  it("resolves by kind + key", () => {
    expect(lookup("sign", "Leo")).toContain("fire");
    expect(lookup("number", "1")).toBeTruthy();
    expect(lookup("arcana", "0")).toContain("Fool");
    expect(lookup("sign", "Nope")).toBeUndefined();
  });
});

describe("interpretationsFor", () => {
  it("produces lines for a Western chart and numerology", () => {
    const w = western.compute(
      { id: "t", date: "1990-06-15", time: "12:00", place: { lat: 51.5, lng: -0.1, tz: "Europe/London" }, precision: "date-time-place" },
      { ephemeris: getEphemeris() },
    );
    const wl = interpretationsFor("western-tropical", w);
    expect(wl.length).toBeGreaterThan(3);
    expect(wl[0].label).toMatch(/ in /);

    const n = numerology.compute({ id: "t", date: "1990-06-15", precision: "date" }, { ephemeris: getEphemeris() });
    const nl = interpretationsFor("numerology-pythagorean", n);
    expect(nl[0].label).toMatch(/Life Path/);
  });
});
