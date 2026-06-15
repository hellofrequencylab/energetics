import { describe, expect, it } from "vitest";
import { engine, reduce } from "./engine";

const factors = (date: string) =>
  engine.compute({ id: "t", date, precision: "date" }, { ephemeris: null as never }).factors;

const num = (date: string, key: string) => factors(date)[key].value as number;

describe("numerology (pythagorean)", () => {
  it("reduce preserves master numbers but reduces the rest", () => {
    expect(reduce(11)).toBe(11);
    expect(reduce(22)).toBe(22);
    expect(reduce(33)).toBe(33);
    expect(reduce(38)).toBe(11); // 3+8=11, kept
    expect(reduce(19)).toBe(1); // 1+9=10 → 1
  });

  it("Life Path is the full digit sum, keeping a master only at the final step", () => {
    // 1950-01-06: 1+9+5+0+0+1+0+6 = 22 (master kept). The old component method
    // wrongly returned 4 by leaking nothing and over-reducing.
    expect(num("1950-01-06", "life-path")).toBe(22);
    // 2000-01-01: 2+0+0+0+0+1+0+1 = 4.
    expect(num("2000-01-01", "life-path")).toBe(4);
  });

  it("does not let a master in the month or day leak into the Life Path", () => {
    // November (11) and the 22nd must reduce to 2/4 inside the date digit sum,
    // not survive as 11/22. 2001-11-22 → 2+0+0+1+1+1+2+2 = 9.
    expect(num("2001-11-22", "life-path")).toBe(9);
  });

  it("the main challenge always stays within 0..8 (never a master)", () => {
    // A November birth used to give abs(11-3)=8 from a leaked master; the fixed
    // single-digit method gives abs(2-3)=1.
    expect(num("1990-11-03", "challenge")).toBe(1);
    for (const date of ["1990-11-03", "1988-02-29", "2011-11-11", "1975-09-30"]) {
      const c = num(date, "challenge");
      expect(c).toBeGreaterThanOrEqual(0);
      expect(c).toBeLessThanOrEqual(8);
    }
  });

  it("every challenge stays 0..8 and the main challenge equals the first", () => {
    const f = factors("1990-11-03");
    const main = f.challenge.value as number;
    const four = f.challenges.value as { first: number; second: number; third: number; fourth: number };
    expect(main).toBe(four.first);
    for (const v of Object.values(four)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(8);
    }
  });
});
