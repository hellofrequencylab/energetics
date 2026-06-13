import { describe, expect, it } from "vitest";
import { intake } from "@/lib/core/birth-event";
import { computeChart } from "@/lib/compute";
import { synthesize } from "@/lib/synthesis";
import { independenceGroupOf } from "@/lib/synthesis/weight";

// Albert Einstein — 1879-03-14 11:30, Ulm, Germany.
const { event } = intake({
  name: "Albert Einstein",
  date: "1879-03-14",
  time: "11:30",
  place: { lat: 48.4011, lng: 9.9876, tz: "Europe/Berlin" },
});
const { computations } = computeChart(event);
const synthesis = synthesize(event.id, computations);

describe("engine golden values", () => {
  it("computes a Pisces Sun in Western tropical", () => {
    const western = computations.find((c) => c.meta.id === "western-tropical");
    expect((western?.native.factors.sun.value as { sign: string }).sign).toBe("Pisces");
  });

  it("computes Pythagorean Life Path 6", () => {
    const num = computations.find((c) => c.meta.id === "numerology-pythagorean");
    expect(num?.native.factors["life-path"].value).toBe(6);
  });

  it("runs every satisfiable system at date-time-place precision", () => {
    const ids = computations.map((c) => c.meta.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        "western-tropical",
        "vedic-jyotish",
        "chinese-bazi",
        "numerology-pythagorean",
        "tzolkin",
      ]),
    );
  });
});

describe("independence grouping (spec §7.3)", () => {
  it("puts the two ephemeris systems in the same group", () => {
    expect(independenceGroupOf("western-tropical")).toBe(independenceGroupOf("vedic-jyotish"));
  });
  it("puts date-derived systems in a group distinct from ephemeris", () => {
    expect(independenceGroupOf("numerology-pythagorean")).toBe(independenceGroupOf("tzolkin"));
    expect(independenceGroupOf("numerology-pythagorean")).not.toBe(independenceGroupOf("western-tropical"));
  });
  it("merges a hard-derivation dependent into its parent's group", () => {
    expect(independenceGroupOf("gene-keys")).toBe(independenceGroupOf("human-design"));
    expect(independenceGroupOf("tarot-birth-cards")).toBe(independenceGroupOf("numerology-pythagorean"));
  });
  it("puts the name-derived system in its own group", () => {
    const name = independenceGroupOf("numerology-chaldean");
    expect(name).not.toBe(independenceGroupOf("western-tropical"));
    expect(name).not.toBe(independenceGroupOf("numerology-pythagorean"));
  });
});

describe("deterministic synthesis", () => {
  it("never stacks systems beyond their distinct independence groups", () => {
    for (const conv of synthesis.convergences) {
      const groups = new Set(conv.contributors.map((a) => independenceGroupOf(a.systemId)));
      expect(conv.independentGroups).toBe(groups.size);
      expect(conv.independentGroups).toBeLessThanOrEqual(3); // ephemeris + date + name
    }
  });

  it("produces at least one cross-source convergence (2 independent groups)", () => {
    const crossSource = synthesis.convergences.filter((c) => c.independentGroups >= 2);
    expect(crossSource.length).toBeGreaterThan(0);
  });

  it("ranks convergences by independent-group count first", () => {
    for (let i = 1; i < synthesis.convergences.length; i++) {
      expect(synthesis.convergences[i - 1].independentGroups).toBeGreaterThanOrEqual(
        synthesis.convergences[i].independentGroups,
      );
    }
  });

  it("only reports tensions on declared oppositions", () => {
    for (const t of synthesis.tensions) {
      expect(t.sides).toHaveLength(2);
      expect(t.poles).toContain(t.sides[0].value);
      expect(t.poles).toContain(t.sides[1].value);
    }
  });
});
