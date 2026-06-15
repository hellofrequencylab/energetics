import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * The AI usage ledger: per-user daily quotas, the free Resonance allowance, and
 * the global daily spend ceiling (ADR-0008). Reads and writes go through the
 * service role (`createAdminClient`), because anonymous callers have no
 * authenticated DB client and the ledger must be authoritative. When no service
 * key is configured, every helper degrades to "no quota recorded" so the routes
 * fall back to the per-IP burst limiter rather than breaking (the same
 * graceful-degrade as the narrative cache).
 */

export type AiFeature = "chart" | "theme" | "resonance";
export type Tier = "visitor" | "anonymous" | "free" | "plus";

/** Fresh generations allowed per UTC day, by tier. Cache hits never count. */
export const AI_DAILY_LIMITS: Record<Tier, number> = {
  visitor: 3, // no session, attributed by IP hash
  anonymous: 5, // a Supabase anonymous user
  free: 10, // a registered, non-paying user
  plus: 50, // a subscriber (soft cap: high enough to feel unlimited)
};

/** Free Resonance runs for non-Plus users before the paywall (counted all-time). */
export const RESONANCE_FREE_RUNS = 3;

export function dailyLimitFor(tier: Tier): number {
  return AI_DAILY_LIMITS[tier];
}

/** Salted hash of a client IP, so anonymous attribution never stores a raw IP. */
export function hashIp(ip: string): string {
  const salt = process.env.AI_USAGE_SALT ?? "onesky-usage";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface UsageKey {
  userId: string | null;
  ipHash: string | null;
}

/** Fresh generations this viewer has made today, across all features. */
export async function dailyUsedCount(key: UsageKey): Promise<number> {
  const admin = createAdminClient();
  if (!admin) return 0;
  try {
    let q = admin.from("ai_usage").select("*", { count: "exact", head: true }).eq("day", today());
    q = key.userId ? q.eq("user_id", key.userId) : q.eq("ip_hash", key.ipHash ?? "");
    const { count } = await q;
    return count ?? 0;
  } catch {
    return 0;
  }
}

/** How many Resonance readings this user has generated, all time (Plus exempt). */
export async function resonanceRunsUsed(key: UsageKey): Promise<number> {
  const admin = createAdminClient();
  if (!admin) return 0;
  try {
    let q = admin
      .from("ai_usage")
      .select("*", { count: "exact", head: true })
      .eq("feature", "resonance");
    q = key.userId ? q.eq("user_id", key.userId) : q.eq("ip_hash", key.ipHash ?? "");
    const { count } = await q;
    return count ?? 0;
  } catch {
    return 0;
  }
}

/** The day's total estimated AI spend, in USD, across all viewers. */
export async function globalDailySpendUsd(): Promise<number> {
  const admin = createAdminClient();
  if (!admin) return 0;
  try {
    const { data } = await admin.from("ai_usage").select("est_cost_usd").eq("day", today());
    if (!data) return 0;
    return (data as { est_cost_usd: number | string }[]).reduce((sum, r) => sum + Number(r.est_cost_usd), 0);
  } catch {
    return 0;
  }
}

/** The configured global daily budget in USD, or null when not enforced. */
export function dailyBudgetUsd(): number | null {
  const raw = process.env.AI_DAILY_BUDGET_USD;
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Record one fresh generation in the ledger. Best-effort; never throws. */
export async function recordUsage(
  key: UsageKey,
  feature: AiFeature,
  estCostUsd: number,
): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;
  try {
    await admin.from("ai_usage").insert({
      user_id: key.userId,
      ip_hash: key.userId ? null : key.ipHash,
      feature,
      est_cost_usd: Number(estCostUsd.toFixed(5)),
      day: today(),
    });
  } catch {
    // A ledger write failure must not break the reading.
  }
}
