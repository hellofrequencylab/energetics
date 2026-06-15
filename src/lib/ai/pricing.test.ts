import { describe, it, expect } from "vitest";
import { approxTokens, estimateGenerationCostUsd, MODEL_PRICING } from "./pricing";

describe("approxTokens", () => {
  it("uses ~4 characters per token", () => {
    expect(approxTokens("")).toBe(0);
    expect(approxTokens("abcd")).toBe(1);
    expect(approxTokens("abcde")).toBe(2); // rounds up
  });
});

describe("estimateGenerationCostUsd", () => {
  it("charges input tokens plus the full output budget (worst case)", () => {
    // 4000 chars -> 1000 input tokens at $5/1M = $0.005; 8000 output at $25/1M = $0.20.
    const cost = estimateGenerationCostUsd({
      model: "claude-opus-4-8",
      inputText: "x".repeat(4000),
      maxTokens: 8000,
    });
    expect(cost).toBeCloseTo(0.005 + 0.2, 6);
  });

  it("is cheaper for a cheaper model", () => {
    const opus = estimateGenerationCostUsd({ model: "claude-opus-4-8", inputText: "x".repeat(4000), maxTokens: 8000 });
    const haiku = estimateGenerationCostUsd({ model: "claude-haiku-4-5", inputText: "x".repeat(4000), maxTokens: 8000 });
    expect(haiku).toBeLessThan(opus);
  });

  it("falls back to an Opus-class rate for an unknown model (never under-bounds)", () => {
    const unknown = estimateGenerationCostUsd({ model: "made-up", inputText: "x".repeat(4000), maxTokens: 8000 });
    const opus = estimateGenerationCostUsd({ model: "claude-opus-4-8", inputText: "x".repeat(4000), maxTokens: 8000 });
    expect(unknown).toBeCloseTo(opus, 6);
  });

  it("knows the headline models", () => {
    expect(MODEL_PRICING["claude-opus-4-8"]).toEqual({ input: 5, output: 25 });
    expect(MODEL_PRICING["claude-sonnet-4-6"]).toEqual({ input: 3, output: 15 });
    expect(MODEL_PRICING["claude-haiku-4-5"]).toEqual({ input: 1, output: 5 });
  });
});
