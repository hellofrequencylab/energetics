import { describe, expect, it } from "vitest";
import { engine } from "./engine";

const compute = (name: string) =>
  engine.compute({ id: "t", date: "1879-03-14", precision: "date", name }, { ephemeris: null as never });

describe("chaldean numerology", () => {
  it("computes 'Albert Einstein' = 1 (compound 46)", () => {
    const res = compute("Albert Einstein");
    expect(res.factors.compound.value).toBe(46);
    expect(res.factors["name-number"].value).toBe(1);
  });

  it("returns no factors without a name", () => {
    const res = engine.compute({ id: "t", date: "1879-03-14", precision: "date" }, { ephemeris: null as never });
    expect(Object.keys(res.factors)).toHaveLength(0);
  });
});
