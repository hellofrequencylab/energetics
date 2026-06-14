import { describe, expect, it } from "vitest";
import { intake } from "@/lib/core/birth-event";
import { computeChart } from "@/lib/compute";

// A fully-specified chart so every diagram-bearing system computes.
const { event } = intake({
  name: "Albert Einstein",
  date: "1879-03-14",
  time: "11:30",
  place: { lat: 48.4011, lng: 9.9876, tz: "Europe/Berlin" },
});
const { computations } = computeChart(event);
const factorsOf = (id: string) => computations.find((c) => c.meta.id === id)?.native.factors ?? {};

describe("diagram source data", () => {
  it("Human Design exposes centers and channels for the bodygraph", () => {
    const f = factorsOf("human-design");
    expect(f.centers?.value).toBeTypeOf("object");
    expect(Array.isArray(f.channels?.value)).toBe(true);
  });

  it("BaZi exposes all four pillars with stems, branches, and elements", () => {
    const p = factorsOf("chinese-bazi").pillars?.value as
      | Record<string, { stem: string; branch: string; element: string }>
      | undefined;
    expect(p).toBeTruthy();
    for (const key of ["year", "month", "day", "hour"]) {
      expect(p?.[key].stem).toBeTruthy();
      expect(p?.[key].branch).toBeTruthy();
      expect(p?.[key].element).toBeTruthy();
    }
  });

  it("Tzolk'in exposes a day sign and a galactic tone", () => {
    const f = factorsOf("tzolkin");
    expect((f["day-sign"]?.value as { daySign: string })?.daySign).toBeTruthy();
    expect(f.tone?.value).toBeTypeOf("number");
  });

  it("Dreamspell exposes a seal and a tone", () => {
    const f = factorsOf("dreamspell");
    expect(f.seal?.value).toBeTruthy();
    expect(f.tone?.value).toBeTypeOf("number");
  });

  it("Tarot exposes personality and soul cards", () => {
    const f = factorsOf("tarot-birth-cards");
    expect((f.personality?.value as { card: string })?.card).toBeTruthy();
    expect((f.soul?.value as { number: number })?.number).toBeTypeOf("number");
  });

  it("Numerology exposes a life path number", () => {
    expect(factorsOf("numerology-pythagorean")["life-path"]?.value).toBeTypeOf("number");
  });
});
