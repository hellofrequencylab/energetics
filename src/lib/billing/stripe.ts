import Stripe from "stripe";

/**
 * Stripe client and config (ADR-0008). All server-only. Returns null when
 * `STRIPE_SECRET_KEY` is absent, so the app and the billing routes run (and
 * report "not set up yet") before the operator wires up Stripe. Secrets and price
 * ids are server env vars, never exposed to the browser.
 */
let cached: Stripe | null | undefined;

export function getStripe(): Stripe | null {
  if (cached !== undefined) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  cached = key ? new Stripe(key) : null;
  return cached;
}

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/** The configured price id for a billing interval, or null if not set. */
export function priceIdFor(interval: "month" | "year"): string | null {
  return interval === "year"
    ? (process.env.STRIPE_PRICE_YEARLY ?? null)
    : (process.env.STRIPE_PRICE_MONTHLY ?? null);
}
