import { describe, expect, it } from "vitest";
import { engine } from "./engine";

const ZHI = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

const res = engine.compute(
  { id: "t", date: "1990-06-15", time: "12:30", precision: "date-time" },
  { ephemeris: null as never },
);

describe("zi wei dou shu (frame verified; stars self-consistent, validation-pending)", () => {
  it("computes lunar basis, Life/Body palace, and a Five Elements Bureau", () => {
    expect(res.factors.lunar).toBeDefined();
    expect(ZHI).toContain((res.factors["life-palace"].value as { branch: string }).branch);
    expect(ZHI).toContain((res.factors["body-palace"].value as { branch: string }).branch);
    expect((res.factors.bureau.value as { n: number }).n).toBeGreaterThanOrEqual(2);
    expect((res.factors.bureau.value as { n: number }).n).toBeLessThanOrEqual(6);
  });

  it("reads element + animal off the Life Palace branch and a year polarity", () => {
    const life = res.factors["life-palace"].value as { element: string; animal: string };
    expect(["wood", "fire", "earth", "metal", "water"]).toContain(life.element);
    expect(life.animal).toBeTruthy();
    expect(["Yang", "Yin"]).toContain((res.factors.polarity.value as { polarity: string }).polarity);
  });

  it("places all 14 major stars in valid branches", () => {
    const stars = (res.factors.stars.value as { stars: Record<string, number> }).stars;
    expect(Object.keys(stars)).toHaveLength(14);
    for (const b of Object.values(stars)) {
      expect(b).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThanOrEqual(11);
    }
  });

  it("keeps the 紫微/天府 reflection invariant (tianFu = 4 − ziWei)", () => {
    const stars = (res.factors.stars.value as { stars: Record<string, number> }).stars;
    const zi = stars["紫微 Zi Wei"];
    const tf = stars["天府 Tian Fu"];
    expect(((4 - zi) % 12 + 12) % 12).toBe(tf);
  });

  it("labels all 12 palaces", () => {
    expect(Object.keys(res.factors.palaces.value as Record<string, string>)).toHaveLength(12);
  });

  it("flags validation-pending", () => {
    expect(res.factors.note.value).toBe("validation-pending");
  });
});
