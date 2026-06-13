import { describe, expect, it } from "vitest";
import type { BirthEvent } from "@/lib/core/birth-event";
import { getEphemeris } from "@/lib/core/ephemeris";
import { engine } from "./engine";
import { adapter } from "./adapter";
import type { WesternPlacement } from "./engine";

const eph = getEphemeris();
const run = (event: BirthEvent) => engine.compute(event, { ephemeris: eph });

function ev(partial: Partial<BirthEvent> & Pick<BirthEvent, "date" | "precision">): BirthEvent {
  return { id: "t", ...partial };
}

describe("western: definitional cardinal points (§4)", () => {
  // ~6h after each 2000 ingress so the Sun sits just inside the cardinal sign.
  const cases: [string, string, string][] = [
    ["2000-03-20", "14:00", "Aries"],
    ["2000-06-21", "08:00", "Cancer"],
    ["2000-09-22", "23:00", "Libra"],
    ["2000-12-21", "20:00", "Capricorn"],
  ];
  for (const [date, time, sign] of cases) {
    it(`Sun ≈ 0° ${sign}`, () => {
      const res = run(ev({ date, time, precision: "date-time" }));
      const sun = res.factors.sun.value as WesternPlacement;
      expect(sun.sign).toBe(sign);
      expect(sun.degree).toBeLessThan(1);
    });
  }
});

describe("western: precision tiering (§0)", () => {
  const base = { date: "1990-06-15", id: "t" } as const;

  it("date-only: signs but no angles/houses/aspects", () => {
    const res = run(ev({ ...base, precision: "date" }));
    expect(res.factors.sun).toBeDefined();
    expect(res.factors.ascendant).toBeUndefined();
    expect(res.factors.houses).toBeUndefined();
    expect(res.factors.aspects).toBeUndefined();
  });

  it("date-time: aspects + lunar phase, still no houses/angles", () => {
    const res = run(ev({ ...base, time: "12:00", precision: "date-time" }));
    expect(res.factors.aspects).toBeDefined();
    expect(res.factors["lunar-phase"]).toBeDefined();
    expect(res.factors.ascendant).toBeUndefined();
    expect(res.factors.houses).toBeUndefined();
  });

  it("date-time-place: full chart with Ascendant + houses", () => {
    const res = run(
      ev({ ...base, time: "12:00", place: { lat: 51.5074, lng: -0.1278, tz: "Europe/London" }, precision: "date-time-place" }),
    );
    expect(res.factors.ascendant).toBeDefined();
    expect(res.factors.houses).toBeDefined();
    const sun = res.factors.sun.value as WesternPlacement;
    expect(sun.house).toBeGreaterThanOrEqual(1);
    expect(sun.house).toBeLessThanOrEqual(12);
  });
});

describe("western: retrograde is detected dynamically", () => {
  it("an outer planet's retrograde state changes across the year", () => {
    const jan = run(ev({ date: "2020-01-01", time: "00:00", precision: "date-time" }));
    const jul = run(ev({ date: "2020-07-01", time: "00:00", precision: "date-time" }));
    const rx = (r: ReturnType<typeof run>) => (r.factors.pluto.value as WesternPlacement).retrograde;
    expect(rx(jan)).not.toBe(rx(jul)); // Pluto is Rx roughly half the year
  });
});

describe("western adapter: generational damping (§5a)", () => {
  it("weights the Sun at 0.90 and Pluto at 0.20", () => {
    const res = run(
      ev({ date: "1990-06-15", time: "12:00", place: { lat: 51.5074, lng: -0.1278, tz: "Europe/London" }, precision: "date-time-place" }),
    );
    const prims = adapter.toPrimitives(res);
    const sunElement = prims.find((p) => p.axis === "element" && p.native.factorKey === "sun");
    const plutoElement = prims.find((p) => p.axis === "element" && p.native.factorKey === "pluto");
    expect(sunElement?.weight).toBe(0.9);
    expect(plutoElement?.weight).toBe(0.2);
  });
});
