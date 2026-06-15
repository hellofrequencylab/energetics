import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, stripeConfigured } from "@/lib/billing/stripe";
import { SITE_URL } from "@/lib/site";

export const runtime = "nodejs";

/**
 * POST /api/billing/portal
 * Opens the Stripe Customer Portal, where the user manages payment, upgrades, and
 * cancels (cancellation is as easy as signing up, per ADR-0008). Returns { url }.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } = { user: null } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  if (!user) {
    return Response.json({ error: "Please sign in first." }, { status: 401 });
  }
  if (!stripeConfigured()) {
    return Response.json({ error: "The billing portal is not set up yet." }, { status: 503 });
  }

  const admin = createAdminClient();
  const { data } = admin
    ? await admin.from("customers").select("stripe_customer_id").eq("user_id", user.id).maybeSingle()
    : { data: null };
  const customer = (data as { stripe_customer_id?: string } | null)?.stripe_customer_id;
  if (!customer) {
    return Response.json({ error: "No subscription found for this account." }, { status: 400 });
  }

  const origin = request.headers.get("origin") ?? SITE_URL;
  const stripe = getStripe()!;
  const session = await stripe.billingPortal.sessions.create({
    customer,
    return_url: `${origin}/account`,
  });

  return Response.json({ url: session.url });
}
