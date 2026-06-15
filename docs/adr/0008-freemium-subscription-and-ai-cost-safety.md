# 0008. Freemium with a Plus subscription, and hard AI cost safety

Status: Accepted

## Context

OneSky's promise is "free to read, no account needed, your birth data stays
yours." We want to keep that promise while earning revenue and, just as urgently,
while bounding the cost of the LLM narrative routes. Today the three narrate
routes (`/api/charts/narrate`, `/api/synastry/narrate`, `/api/themes/narrate`)
are fully public and protected only by a per-IP burst limit. They each can run an
Opus-class generation (`max_tokens: 8000`, adaptive thinking). There is no
per-user quota and no global spend ceiling, so a few heavy users or a script can
run up an unbounded bill. Providers do not hard-stop spend, so we must.

We researched the category (RevenueCat/Adapty 2025-26 subscription data; CHANI,
Co-Star, The Pattern, Headspace; Supabase and Stripe docs; LLM cost-control
practice). The consistent guidance for a wellness/astrology product: gate
**depth**, not the core; place the ask **after** the user's "aha" moment; meter
AI on **cost, not request count**; and build your own budget circuit breaker.

## Decision

**Freemium with one paid tier ("OneSky Plus"), an always-free core, and a
cost-safety layer that is independent of payments.**

Tiers:

- **Free (no signup):** compute the full chart across the core systems and read
  the full *basic* AI narrative (cached, so re-reads never re-bill). Save up to
  **3 charts**. Run **Resonance 3 times**. No drill-down into the major areas or
  per-system depth, no daily Today page.
- **Plus (subscription, $8.99/mo or $59.99/yr):** drill-down into every major
  area, all registered systems, longer/refreshable readings, unlimited Resonance,
  the daily Today page, save beyond 3 charts, and practitioner tools (private
  notes, client charts, exports). New accounts may start a **7-day free trial
  (card required)** via Stripe.

Entitlement is its own concept, separate from `account_type` (which stays a UX
preference). `getEntitlement()` returns `plus` when the user has a Stripe
subscription in `trialing`/`active` (or is an admin, for preview); everyone else
is `free`. It is enforced **server-side and in RLS**, never only in the UI.

Cost safety (ships first, works with no Stripe and no keys):

- **Per-viewer daily quota** on fresh narrations (cache hits and the
  "not configured" note are free): visitor 3, anonymous 5, free 10, Plus 50.
- **Per-feature gates:** drill-down (`themes/narrate`) is Plus-only; Resonance
  (`synastry/narrate`) is free for 3 runs, then Plus.
- **Global daily budget breaker** (`AI_DAILY_BUDGET_USD`, opt-in): each call is
  pre-authorized at worst-case cost against the day's spend; over budget degrades
  to the cache or a friendly "back tomorrow", never a raw error.
- **Turnstile** verifies unauthenticated narrate calls before any spend (active
  only when `TURNSTILE_SECRET_KEY` is set).
- Usage is tracked in `energetics.ai_usage` (the durable ledger), read/written
  with the service role. When no service key is present, the quota degrades to the
  existing per-IP burst limit (fail-open), the same graceful-degrade as the
  narrative cache.

Stripe follows the single-source-of-truth pattern: hosted Checkout + Customer
Portal + one idempotent webhook handler that re-syncs the customer's subscription
from Stripe into `energetics.subscriptions` on every relevant event.

## Consequences

- The core promise holds: a full basic reading stays free with no account, and
  every gate carries a clear, honest upgrade prompt with a "not now" escape and a
  restated privacy note where birth data is involved (DESIGN voice rules apply).
- Cost is bounded by per-user quotas (the "whale" 80/20 problem), an optional
  global breaker, and caching, regardless of tier or payment state.
- Anonymous sign-ins give per-user (not per-IP) limits and a seamless
  anonymous -> registered -> paid upgrade that preserves the user id, so saved
  charts carry over. The trade-offs (CAPTCHA, stale-user cleanup, MAU) are
  managed in the auth/data layer; the pure engines and deterministic synthesis
  are untouched.
- Stripe go-live needs the operator's keys and a webhook; everything else
  (gates, quotas, paywall UI, trial copy) ships and works without them. Until
  then, Plus is reachable for admins (preview) and by inserting a subscription
  row.
- New env: `AI_DAILY_BUDGET_USD`, `TURNSTILE_SECRET_KEY`,
  `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
  `NEXT_PUBLIC_STRIPE_*` price ids. New migration `0010_billing.sql`. See
  `docs/RUNBOOK.md`.
