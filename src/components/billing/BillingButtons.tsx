"use client";

import { useState } from "react";

/**
 * Client buttons for the billing flows (ADR-0008). They POST to the server
 * routes, which talk to Stripe, and redirect to the hosted Checkout or Customer
 * Portal. Until Stripe keys are configured the routes return a friendly note,
 * which is shown inline rather than as an error.
 */

function useRedirectAction(endpoint: string) {
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  async function go() {
    setLoading(true);
    setNote(null);
    try {
      const res = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json" } });
      const info = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (res.ok && info?.url) {
        window.location.href = info.url;
        return;
      }
      setNote(info?.error ?? "This is not available yet. Please try again later.");
    } catch {
      setNote("Something went wrong. Please try again.");
    }
    setLoading(false);
  }
  return { loading, note, go };
}

const PRIMARY =
  "inline-block rounded-lg bg-horizon-amber px-5 py-2.5 text-sm font-semibold text-ink transition hover:brightness-110 disabled:opacity-60";
const SECONDARY =
  "inline-block rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-surface disabled:opacity-60";

export function StartTrialButton({ label = "Start your 7-day free trial" }: { label?: string }) {
  const { loading, note, go } = useRedirectAction("/api/billing/checkout");
  return (
    <div>
      <button onClick={go} disabled={loading} className={PRIMARY}>
        {loading ? "One moment…" : label}
      </button>
      {note && <p className="mt-2 text-sm text-muted">{note}</p>}
    </div>
  );
}

export function ManageSubscriptionButton({ label = "Manage subscription" }: { label?: string }) {
  const { loading, note, go } = useRedirectAction("/api/billing/portal");
  return (
    <div>
      <button onClick={go} disabled={loading} className={SECONDARY}>
        {loading ? "One moment…" : label}
      </button>
      {note && <p className="mt-2 text-sm text-muted">{note}</p>}
    </div>
  );
}
