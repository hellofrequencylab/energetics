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

  it("computes Pythagorean Life Path 33 (master), from the full date digit sum", () => {
    // 1+8+7+9+0+3+1+4 = 33, kept as a master number. The old component-reduce
    // method wrongly dropped this to 6 by over-reducing each part first.
    const num = computations.find((c) => c.meta.id === "numerology-pythagorean");
    expect(num?.native.factors["life-path"].value).toBe(33);
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
  it("groups every zodiac system that reads planetary longitude as one voice", () => {
    const sky = independenceGroupOf("western-tropical");
    expect(independenceGroupOf("vedic-jyotish")).toBe(sky);
    expect(independenceGroupOf("hellenistic")).toBe(sky);
    expect(independenceGroupOf("egyptian-decans")).toBe(sky);
  });
  it("groups all numerology (same name and date reduction) as one voice", () => {
    const num = independenceGroupOf("numerology-pythagorean");
    expect(independenceGroupOf("numerology-chaldean")).toBe(num);
    expect(independenceGroupOf("numerology-lo-shu")).toBe(num);
  });
  it("groups the Chinese calendrical systems as one voice", () => {
    const chinese = independenceGroupOf("chinese-bazi");
    expect(independenceGroupOf("nine-star-ki")).toBe(chinese);
    expect(independenceGroupOf("zi-wei-dou-shu")).toBe(chinese);
  });
  it("keeps genuinely distinct traditions independent of one another", () => {
    const distinct = [
      "western-tropical", // sky
      "human-design", // i ching gates
      "chinese-bazi", // chinese
      "tzolkin", // maya
      "numerology-pythagorean", // numerology
      "celtic-tree", // seasonal
      "mahabote", // burmese
    ].map(independenceGroupOf);
    expect(new Set(distinct).size).toBe(distinct.length);
  });
  it("merges a hard-derivation dependent into its parent's group", () => {
    expect(independenceGroupOf("gene-keys")).toBe(independenceGroupOf("human-design"));
    expect(independenceGroupOf("tarot-birth-cards")).toBe(independenceGroupOf("numerology-pythagorean"));
  });
});

describe("deterministic synthesis", () => {
  it("never stacks systems beyond their distinct independence groups", () => {
    for (const conv of synthesis.convergences) {
      const groups = new Set(conv.contributors.map((a) => independenceGroupOf(a.systemId)));
      expect(conv.independentGroups).toBe(groups.size);
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
