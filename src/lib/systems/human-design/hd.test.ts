import { describe, expect, it } from "vitest";
import { getEphemeris } from "@/lib/core/ephemeris";
import { engine, gateLine } from "./engine";
import { CENTERS, CENTER_GATES, CHANNELS, GATE_CENTER, GATE_WHEEL } from "./data";

describe("human-design data consistency", () => {
  it("the gate wheel has all 64 gates exactly once", () => {
    expect(GATE_WHEEL).toHaveLength(64);
    expect(new Set(GATE_WHEEL).size).toBe(64);
    for (let g = 1; g <= 64; g++) expect(GATE_WHEEL).toContain(g);
  });

  it("center memberships partition all 64 gates", () => {
    const all = CENTERS.flatMap((c) => CENTER_GATES[c]);
    expect(all).toHaveLength(64);
    expect(new Set(all).size).toBe(64);
  });

  it("every channel joins two gates in two distinct centers", () => {
    expect(CHANNELS).toHaveLength(36);
    for (const [a, b] of CHANNELS) {
      expect(GATE_CENTER[a]).toBeDefined();
      expect(GATE_CENTER[b]).toBeDefined();
      expect(GATE_CENTER[a]).not.toBe(GATE_CENTER[b]);
    }
  });

  it("maps the verified anchor: 2°00′ Aquarius (302°) → Gate 41 line 1", () => {
    expect(gateLine(302).gate).toBe(41);
    expect(gateLine(302).line).toBe(1);
    expect(gateLine(307.625).gate).toBe(19); // next gate per the verified sequence
  });
});

describe("human-design engine (structure; tables validation-pending)", () => {
  const res = engine.compute(
    { id: "t", date: "1879-03-14", time: "11:30", place: { lat: 48.4011, lng: 9.9876, tz: "Europe/Berlin" }, precision: "date-time-place" },
    { ephemeris: getEphemeris() },
  );

  it("produces a valid Type, Authority, Profile, Definition", () => {
    expect(["Manifestor", "Generator", "Manifesting Generator", "Projector", "Reflector"]).toContain(
      res.factors.type.value,
    );
    expect([
      "Emotional", "Sacral", "Splenic", "Ego", "Self-Projected", "Mental (outer)", "Lunar",
    ]).toContain(res.factors.authority.value);
    expect(res.factors.profile.value as string).toMatch(/^[1-6]\/[1-6]$/);
    expect(["None", "Single", "Split", "Triple Split", "Quadruple Split"]).toContain(res.factors.definition.value);
  });

  it("has 9 centers and a 4-gate incarnation cross", () => {
    expect(Object.keys(res.factors.centers.value as Record<string, boolean>)).toHaveLength(9);
    expect(res.factors.cross.value as number[]).toHaveLength(4);
  });

  it("flags validation-pending", () => {
    expect(res.factors.note.value).toBe("validation-pending");
  });
});
