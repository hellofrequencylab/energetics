import { createClient } from "@/lib/supabase/server";
import { getStripe, stripeConfigured, priceIdFor } from "@/lib/billing/stripe";
import { getOrCreateCustomer } from "@/lib/billing/sync";
import { PLUS } from "@/lib/billing/plans";
import { SITE_URL } from "@/lib/site";

export const runtime = "nodejs";

/**
 * POST /api/billing/checkout
 * Starts a Stripe-hosted Checkout for OneSky Plus with a 7-day free trial. Creates
 * (or reuses) the user's Stripe customer first, so the webhook can always resolve
 * the subscription back to a user. Returns { url } to redirect to.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } = { user: null } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  if (!user) {
    return Response.json({ error: "Please sign in first." }, { status: 401 });
  }
  if (user.is_anonymous) {
    return Response.json({ error: "Add an email to your account to subscribe." }, { status: 402 });
  }
  if (!stripeConfigured()) {
    return Response.json({ error: "Checkout is not set up yet. Please check back soon." }, { status: 503 });
  }

  const interval = (await request.json().catch(() => ({})))?.interval === "year" ? "year" : "month";
  const price = priceIdFor(interval);
  if (!price) {
    return Response.json({ error: "Checkout is not set up yet. Please check back soon." }, { status: 503 });
  }

  const stripe = getStripe()!;
  const customer = await getOrCreateCustomer(user.id, user.email);
  if (!customer) {
    return Response.json({ error: "Could not start checkout. Please try again." }, { status: 500 });
  }

  const origin = request.headers.get("origin") ?? SITE_URL;
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer,
    line_items: [{ price, quantity: 1 }],
    subscription_data: { trial_period_days: PLUS.trialDays },
    allow_promotion_codes: true,
    success_url: `${origin}/account?checkout=success`,
    cancel_url: `${origin}/plus`,
  });

  return Response.json({ url: session.url });
}
