import { describe, it, expect } from "vitest";
import { AI_DAILY_LIMITS, dailyLimitFor, hashIp, RESONANCE_FREE_RUNS } from "./usage";

describe("AI quota config", () => {
  it("increases with tier", () => {
    expect(AI_DAILY_LIMITS.visitor).toBeLessThan(AI_DAILY_LIMITS.anonymous);
    expect(AI_DAILY_LIMITS.anonymous).toBeLessThan(AI_DAILY_LIMITS.free);
    expect(AI_DAILY_LIMITS.free).toBeLessThan(AI_DAILY_LIMITS.plus);
  });

  it("exposes a stable free Resonance allowance", () => {
    expect(RESONANCE_FREE_RUNS).toBe(3);
  });

  it("dailyLimitFor matches the table", () => {
    expect(dailyLimitFor("free")).toBe(AI_DAILY_LIMITS.free);
    expect(dailyLimitFor("plus")).toBe(AI_DAILY_LIMITS.plus);
  });
});

describe("hashIp", () => {
  it("is deterministic and not the raw IP", () => {
    const a = hashIp("203.0.113.7");
    const b = hashIp("203.0.113.7");
    expect(a).toBe(b);
    expect(a).not.toContain("203.0.113.7");
    expect(a).toHaveLength(32);
  });

  it("separates different IPs", () => {
    expect(hashIp("203.0.113.7")).not.toBe(hashIp("203.0.113.8"));
  });
});
