import { describe, expect, it } from "vitest";
import { engine } from "./engine";

const star = (date: string) =>
  engine.compute({ id: "t", date, precision: "date" }, { ephemeris: null as never }).factors["principal-star"]
    .value as { star: number; element: string };

const monthIndex = (date: string) =>
  (engine.compute({ id: "t", date, precision: "date" }, { ephemeris: null as never }).factors["monthly-star"]
    .value as { monthIndex: number }).monthIndex;

describe("nine star ki (principal star)", () => {
  it("matches known years: 1985→6, 2022→5, 2024→3", () => {
    expect(star("1985-06-15").star).toBe(6);
    expect(star("2022-06-15").star).toBe(5);
    expect(star("2024-06-15").star).toBe(3);
  });
  it("uses the previous year before risshun (~Feb 4)", () => {
    expect(star("2024-01-15").star).toBe(star("2023-06-15").star);
  });

  it("places early January (before 小寒 Jan 6) in the prior 大雪 month, not 小寒", () => {
    // Jan 3 is before 小寒 → 11th solar month (大雪). Jan 10 is on/after → 12th (小寒).
    expect(monthIndex("2000-01-03")).toBe(11);
    expect(monthIndex("2000-01-10")).toBe(12);
  });
});
