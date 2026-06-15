/**
 * The single source of truth for plan copy and numbers (ADR-0008). Pure
 * constants, safe to import from server or client. The free limits here mirror
 * the server-enforced values in `src/lib/ai/usage.ts` and migration 0010; keep
 * them in sync (they are asserted together in plans.test.ts).
 */
export const PLUS = {
  name: "OneSky Plus",
  monthlyUsd: 8.99,
  yearlyUsd: 59.99,
  trialDays: 7,
} as const;

/** Free tier limits, for display. Enforced server-side, not here. */
export const FREE_LIMITS = {
  savedCharts: 3,
  resonanceRuns: 3,
} as const;

/** Annual saving vs paying monthly, as a rounded percent (for the toggle copy). */
export function annualSavingPercent(): number {
  const monthlyForYear = PLUS.monthlyUsd * 12;
  return Math.round((1 - PLUS.yearlyUsd / monthlyForYear) * 100);
}

export interface PlanRow {
  feature: string;
  free: string;
  plus: string;
}

/**
 * The free-vs-Plus comparison shown on the Plus page. Every row reflects a gate
 * that is actually enforced server-side (ADR-0008), so the table stays honest.
 */
export const COMPARISON: PlanRow[] = [
  { feature: "Your full chart across every tradition", free: "Yes", plus: "Yes" },
  { feature: "The basic written reading", free: "Yes", plus: "Yes" },
  { feature: "Drill into any theme (Tell me more)", free: "Preview", plus: "Full depth" },
  { feature: "Resonance (compare two charts)", free: `${FREE_LIMITS.resonanceRuns} free`, plus: "Unlimited" },
  { feature: "Today (the day's sky for your chart)", free: "Preview", plus: "Yes" },
  { feature: "Saved charts", free: `Up to ${FREE_LIMITS.savedCharts}`, plus: "Unlimited" },
  { feature: "Practitioner tools (notes and client charts)", free: "No", plus: "Yes" },
];
