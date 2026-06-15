import { cache } from "react";
import type { DbClient } from "@/lib/db/queries";
import { createClient } from "@/lib/supabase/server";
import { currentUser } from "@/lib/auth/session";

/**
 * Entitlement: the one thing that decides Free vs Plus (ADR-0008). It is its own
 * concept, separate from `account_type` (which stays a UX preference). Plus means
 * a live Stripe subscription (`trialing`/`active`) or an admin (so admins can
 * preview the paid experience before Stripe is wired up).
 *
 * Always resolved server-side. The client may render hints, but every gate is
 * enforced here and in RLS, never by trusting the browser.
 */
export type Entitlement = "free" | "plus";

/** The entitling subscription statuses. `past_due` is handled as a short grace by
 * Stripe's dunning, then becomes `canceled`/`unpaid`, so we do not grant on it. */
const ENTITLING = new Set(["trialing", "active"]);

/** Resolve entitlement for a specific user on a given client. */
export async function entitlementFor(supabase: DbClient, userId: string): Promise<Entitlement> {
  // Admins preview Plus.
  const { data: prof } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("user_id", userId)
    .maybeSingle();
  if ((prof as { is_admin?: boolean } | null)?.is_admin) return "plus";

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const status = (sub as { status?: string } | null)?.status;
  return status && ENTITLING.has(status) ? "plus" : "free";
}

/**
 * Entitlement for the current request's user. Memoized per render so the header,
 * nav, and page body share one read. Returns "free" when signed out.
 */
export const getEntitlement = cache(async (): Promise<Entitlement> => {
  const supabase = await createClient();
  if (!supabase) return "free";
  const user = await currentUser();
  if (!user) return "free";
  return entitlementFor(supabase, user.id).catch(() => "free");
});
