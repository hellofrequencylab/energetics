/**
 * Model pricing and worst-case cost estimation for the narrate routes (ADR-0008).
 *
 * Pure and deterministic: no I/O. Used to pre-authorize a generation against the
 * per-user quota and the global daily budget BEFORE the model runs, so spend is
 * bounded even though the provider itself never hard-stops (see the research in
 * ADR-0008). We estimate the worst case (full output budget), which is the safe
 * direction to round for a cost ceiling.
 *
 * Rates are USD per 1,000,000 tokens, input / output, as of 2026-06.
 */
export const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "claude-opus-4-8": { input: 5, output: 25 },
  "claude-sonnet-4-6": { input: 3, output: 15 },
  "claude-haiku-4-5": { input: 1, output: 5 },
};

/** Fallback rate (Opus-class) for an unknown model id, so we never under-bound. */
const DEFAULT_RATE = { input: 5, output: 25 };

/** Roughly 4 characters per token is the standard back-of-envelope for English. */
export function approxTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Worst-case USD cost of one generation: the prompt tokens at the input rate plus
 * the full `maxTokens` output budget at the output rate. Adaptive thinking is
 * billed as output, so charging the whole output budget keeps the estimate
 * conservative (we may slightly over-count, never under-count).
 */
export function estimateGenerationCostUsd(opts: {
  model: string;
  inputText: string;
  maxTokens: number;
}): number {
  const rate = MODEL_PRICING[opts.model] ?? DEFAULT_RATE;
  const inputCost = (approxTokens(opts.inputText) / 1_000_000) * rate.input;
  const outputCost = (opts.maxTokens / 1_000_000) * rate.output;
  return inputCost + outputCost;
}
