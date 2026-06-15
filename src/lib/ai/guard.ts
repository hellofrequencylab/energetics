import { createClient } from "@/lib/supabase/server";
import { entitlementFor, type Entitlement } from "@/lib/billing/entitlement";
import { clientIp, rateLimitShared, tooManyRequests } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/ai/turnstile";
import {
  dailyBudgetUsd,
  dailyLimitFor,
  dailyUsedCount,
  globalDailySpendUsd,
  hashIp,
  recordUsage,
  resonanceRunsUsed,
  RESONANCE_FREE_RUNS,
  type AiFeature,
  type Tier,
  type UsageKey,
} from "@/lib/ai/usage";

/**
 * The single gate every narrate route opens before generating (ADR-0008). It:
 *   1. resolves the viewer (user + entitlement + a usage key),
 *   2. applies the short-window burst limit,
 *   3. checks Turnstile for visitors with no session,
 *   4. applies the per-feature gate (drill-down is Plus, Resonance is 3 free),
 * and hands back a `reserve()` to call right before the model runs, which checks
 * the daily quota and the global budget and records the spend.
 *
 * All gates here are server-authoritative. Cache hits never reach `reserve()`.
 */

export interface Viewer {
  userId: string | null;
  isAnonymous: boolean;
  entitlement: Entitlement;
  tier: Tier;
  key: UsageKey;
}

function tierOf(userId: string | null, isAnonymous: boolean, entitlement: Entitlement): Tier {
  if (entitlement === "plus") return "plus";
  if (!userId) return "visitor";
  return isAnonymous ? "anonymous" : "free";
}

export async function resolveViewer(request: Request): Promise<Viewer> {
  const ipHash = hashIp(clientIp(request));
  const supabase = await createClient();
  if (!supabase) {
    return { userId: null, isAnonymous: false, entitlement: "free", tier: "visitor", key: { userId: null, ipHash } };
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { userId: null, isAnonymous: false, entitlement: "free", tier: "visitor", key: { userId: null, ipHash } };
  }
  const isAnonymous = user.is_anonymous === true;
  const entitlement = await entitlementFor(supabase, user.id).catch<Entitlement>(() => "free");
  return {
    userId: user.id,
    isAnonymous,
    entitlement,
    tier: tierOf(user.id, isAnonymous, entitlement),
    key: { userId: user.id, ipHash },
  };
}

/** A 402 telling the client to show the paywall for a given feature. */
function upgradeRequired(message: string): Response {
  return new Response(JSON.stringify({ error: message, upgrade: true }), {
    status: 402,
    headers: { "content-type": "application/json" },
  });
}

/** Seconds until the next UTC midnight, when daily quotas reset. */
function secondsUntilUtcMidnight(): number {
  const now = new Date();
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  return Math.max(1, Math.ceil((next - now.getTime()) / 1000));
}

export type GateResult =
  | { ok: true; viewer: Viewer; reserve: (estCostUsd: number) => Promise<Response | null> }
  | { ok: false; response: Response };

export async function openNarrateGate(request: Request, feature: AiFeature): Promise<GateResult> {
  // 1. Burst limit (per IP, shared across instances when Redis is configured).
  const rl = await rateLimitShared(request, { key: "ai", limit: 15, windowMs: 60_000 });
  if (!rl.ok) return { ok: false, response: tooManyRequests(rl.retryAfter) };

  const viewer = await resolveViewer(request);

  // 2. Turnstile for visitors with no session (the highest-risk surface).
  if (viewer.tier === "visitor") {
    const token = request.headers.get("x-turnstile-token");
    const human = await verifyTurnstile(token, clientIp(request));
    if (!human) {
      return {
        ok: false,
        response: new Response(JSON.stringify({ error: "Please complete the human check and try again." }), {
          status: 403,
          headers: { "content-type": "application/json" },
        }),
      };
    }
  }

  // 3. Per-feature gate.
  if (feature === "theme" && viewer.entitlement !== "plus") {
    return {
      ok: false,
      response: upgradeRequired("Drill-down readings are part of OneSky Plus. Your chart and its basic reading stay free."),
    };
  }
  if (feature === "resonance" && viewer.entitlement !== "plus") {
    const used = await resonanceRunsUsed(viewer.key);
    if (used >= RESONANCE_FREE_RUNS) {
      return {
        ok: false,
        response: upgradeRequired(
          `You have used your ${RESONANCE_FREE_RUNS} free resonance readings. OneSky Plus makes them unlimited.`,
        ),
      };
    }
  }

  // 4. The reservation to run right before a billable generation.
  const reserve = async (estCostUsd: number): Promise<Response | null> => {
    const used = await dailyUsedCount(viewer.key);
    if (used >= dailyLimitFor(viewer.tier)) {
      const retry = secondsUntilUtcMidnight();
      const msg =
        viewer.tier === "plus"
          ? "You have reached today's reading limit. It resets tomorrow."
          : "You have reached today's free readings. They reset tomorrow, or upgrade to OneSky Plus for more.";
      return new Response(JSON.stringify({ error: msg, upgrade: viewer.tier !== "plus" }), {
        status: 429,
        headers: { "content-type": "application/json", "retry-after": String(retry) },
      });
    }

    const budget = dailyBudgetUsd();
    if (budget !== null) {
      const spent = await globalDailySpendUsd();
      if (spent + estCostUsd > budget) {
        return new Response(
          JSON.stringify({ error: "Readings are taking a short break to catch up. Please try again later." }),
          { status: 503, headers: { "content-type": "application/json", "retry-after": "3600" } },
        );
      }
    }

    await recordUsage(viewer.key, feature, estCostUsd);
    return null;
  };

  return { ok: true, viewer, reserve };
}
