import { describe, it, expect } from "vitest";
import { PLUS, FREE_LIMITS, annualSavingPercent, COMPARISON } from "./plans";
import { RESONANCE_FREE_RUNS } from "@/lib/ai/usage";

describe("plan constants", () => {
  it("the displayed free Resonance count matches the enforced one", () => {
    expect(FREE_LIMITS.resonanceRuns).toBe(RESONANCE_FREE_RUNS);
  });

  it("annual is a real saving over monthly", () => {
    expect(PLUS.yearlyUsd).toBeLessThan(PLUS.monthlyUsd * 12);
    expect(annualSavingPercent()).toBeGreaterThan(0);
    expect(annualSavingPercent()).toBeLessThan(100);
  });

  it("offers a trial", () => {
    expect(PLUS.trialDays).toBeGreaterThan(0);
  });

  it("the comparison covers free and plus for every row", () => {
    expect(COMPARISON.length).toBeGreaterThan(0);
    for (const row of COMPARISON) {
      expect(row.feature.length).toBeGreaterThan(0);
      expect(row.free.length).toBeGreaterThan(0);
      expect(row.plus.length).toBeGreaterThan(0);
    }
  });
});
