import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/billing/stripe";

/**
 * The Stripe <-> DB sync, the single source of truth (ADR-0008). Every webhook
 * event and the post-checkout return call the SAME `syncCustomer`, which re-reads
 * the customer's current subscription from Stripe and upserts it into
 * `energetics.subscriptions`. Re-reading current state makes out-of-order or
 * duplicate webhook deliveries harmless (the pattern from t3dotgg's guide).
 *
 * All writes use the service role (no user JWT exists in a webhook).
 */

function epochToIso(epoch?: number | null): string | null {
  return epoch ? new Date(epoch * 1000).toISOString() : null;
}

/** Find a user's Stripe customer id, creating the customer + mapping if needed. */
export async function getOrCreateCustomer(userId: string, email: string | undefined): Promise<string | null> {
  const admin = createAdminClient();
  const stripe = getStripe();
  if (!admin || !stripe) return null;

  const { data } = await admin.from("customers").select("stripe_customer_id").eq("user_id", userId).maybeSingle();
  const existing = (data as { stripe_customer_id?: string } | null)?.stripe_customer_id;
  if (existing) return existing;

  const customer = await stripe.customers.create({
    email: email || undefined,
    metadata: { user_id: userId },
  });
  await admin.from("customers").upsert({ user_id: userId, stripe_customer_id: customer.id }, { onConflict: "user_id" });
  return customer.id;
}

/**
 * Re-sync the latest subscription for one Stripe customer into our DB. Idempotent:
 * safe to call from any event or the checkout return. No-op when Stripe or the
 * service role is not configured, or the customer is not mapped to a user.
 */
export async function syncCustomer(stripeCustomerId: string): Promise<void> {
  const admin = createAdminClient();
  const stripe = getStripe();
  if (!admin || !stripe) return;

  const { data: cust } = await admin
    .from("customers")
    .select("user_id")
    .eq("stripe_customer_id", stripeCustomerId)
    .maybeSingle();
  const userId = (cust as { user_id?: string } | null)?.user_id;
  if (!userId) return;

  const subs = await stripe.subscriptions.list({ customer: stripeCustomerId, status: "all", limit: 1 });
  const sub = subs.data[0];
  if (!sub) return;

  // Read period fields tolerant of the Stripe API change that moved
  // current_period_end onto subscription items.
  const item = sub.items?.data?.[0] as
    | { current_period_end?: number; price?: { id?: string } }
    | undefined;
  const periodEnd =
    (sub as unknown as { current_period_end?: number }).current_period_end ?? item?.current_period_end ?? null;
  const priceId = item?.price?.id ?? null;

  await admin.from("subscriptions").upsert(
    {
      id: sub.id,
      user_id: userId,
      status: sub.status,
      price_id: priceId,
      cancel_at_period_end: sub.cancel_at_period_end ?? false,
      current_period_end: epochToIso(periodEnd),
      trial_end: epochToIso(sub.trial_end),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );
}
