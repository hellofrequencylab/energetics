import type Stripe from "stripe";
import { getStripe } from "@/lib/billing/stripe";
import { syncCustomer } from "@/lib/billing/sync";
import { logError } from "@/lib/log";

export const runtime = "nodejs";

/**
 * POST /api/billing/webhook
 * The Stripe webhook. Verifies the signature on the RAW body, then re-syncs the
 * affected customer's subscription from Stripe (the single-source-of-truth
 * pattern, ADR-0008). Every handled event calls the same sync, so out-of-order or
 * duplicate deliveries are harmless. This route is server-to-server (no browser
 * Origin), so the CSRF guard lets it through; the signature is the auth.
 */

// The events that can change entitlement. We re-sync on all of them rather than
// branching, so the DB always reflects Stripe's current state.
const HANDLED = new Set<string>([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed",
]);

/** Pull the Stripe customer id off any of the event objects we handle. */
function customerIdFrom(object: Stripe.Event.Data.Object): string | null {
  const customer = (object as { customer?: string | { id?: string } }).customer;
  if (typeof customer === "string") return customer;
  if (customer && typeof customer === "object" && typeof customer.id === "string") return customer.id;
  return null;
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return Response.json({ error: "Webhook not configured." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return Response.json({ error: "Missing signature." }, { status: 400 });
  }

  // Verify against the raw body. Reading text() (not json()) keeps the bytes the
  // signature was computed over intact.
  const raw = await request.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(raw, signature, secret);
  } catch {
    return Response.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (HANDLED.has(event.type)) {
    const customerId = customerIdFrom(event.data.object);
    if (customerId) {
      try {
        await syncCustomer(customerId);
      } catch (err) {
        // Log and return 500 so Stripe retries; the sync is idempotent.
        logError("stripe.webhook.sync", err, { type: event.type });
        return Response.json({ error: "Sync failed." }, { status: 500 });
      }
    }
  }

  return Response.json({ received: true });
}
