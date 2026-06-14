import { describe, expect, it } from "vitest";
import { intake } from "@/lib/core/birth-event";
import { computeChart } from "@/lib/compute";
import { CATALOG, defaultEnabledIds, inSynthesisFor } from "./catalog";
import { allMeta, offeredMeta } from "./registry";

describe("system catalog", () => {
  it("offers exactly the core set by default", () => {
    const ids = [...defaultEnabledIds()].sort();
    expect(ids).toEqual(
      [
        "western-tropical",
        "human-design",
        "numerology-pythagorean",
        "tzolkin",
        "chinese-bazi",
        "tarot-birth-cards",
        "dreamspell",
      ].sort(),
    );
  });

  it("keeps the rest registered but off by default", () => {
    const off = ["vedic-jyotish", "hellenistic", "gene-keys", "zi-wei-dou-shu", "egyptian-decans"];
    for (const id of off) expect(defaultEnabledIds().has(id)).toBe(false);
  });

  it("registers the new systems, off by default", () => {
    const registered = new Set(allMeta().map((m) => m.id));
    for (const id of ["kabbalah-tree-of-life", "tibetan-astrology", "numerology-lo-shu"]) {
      expect(registered.has(id)).toBe(true);
      expect(id in CATALOG).toBe(true);
      expect(defaultEnabledIds().has(id)).toBe(false);
    }
  });

  it("keeps Dreamspell shown but out of the synthesis", () => {
    expect(defaultEnabledIds().has("dreamspell")).toBe(true);
    expect(inSynthesisFor("dreamspell")).toBe(false);
    expect(inSynthesisFor("western-tropical")).toBe(true);
  });

  it("offeredMeta lists only the default-enabled systems", () => {
    const offered = new Set(offeredMeta().map((m) => m.id));
    expect(offered).toEqual(defaultEnabledIds());
  });
});

const { event } = intake({
  name: "Albert Einstein",
  date: "1879-03-14",
  time: "11:30",
  place: { lat: 48.4011, lng: 9.9876, tz: "Europe/Berlin" },
});

describe("computeChart gating", () => {
  it("runs only the requested systems when `only` is given", () => {
    const only = new Set(["western-tropical", "numerology-pythagorean"]);
    const { computations } = computeChart(event, { only });
    const ids = computations.map((c) => c.meta.id);
    expect(ids).toContain("western-tropical");
    expect(ids).not.toContain("vedic-jyotish");
    expect(ids.every((id) => only.has(id))).toBe(true);
  });

  it("still runs every satisfiable system with no gate (back-compat)", () => {
    const { computations } = computeChart(event);
    const ids = computations.map((c) => c.meta.id);
    expect(ids).toEqual(expect.arrayContaining(["western-tropical", "vedic-jyotish", "tzolkin"]));
  });
});
