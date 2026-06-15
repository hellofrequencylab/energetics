import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "@/components/site/SiteShell";
import { PageHeader, Card } from "@/components/ui";
import { StartTrialButton, ManageSubscriptionButton } from "@/components/billing/BillingButtons";
import { currentUser } from "@/lib/auth/session";
import { getEntitlement } from "@/lib/billing/entitlement";
import { PLUS, COMPARISON, FREE_LIMITS, annualSavingPercent } from "@/lib/billing/plans";

export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "OneSky Plus",
  description:
    "Read your chart in full depth across every tradition, compare charts without limit, and follow the day's sky. Your basic chart and reading stay free.",
  alternates: { canonical: "/plus" },
};

const money = (n: number) => (Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`);

export default async function PlusPage() {
  const user = await currentUser();
  const entitlement = await getEntitlement();
  const isPlus = entitlement === "plus";

  return (
    <SiteShell>
      <PageHeader
        eyebrow="Plans"
        title="OneSky Plus"
        description="Your full chart and its basic reading are always free, no account needed. Plus opens the depth: every tradition, every major area, unlimited resonance, and the day's sky."
      />

      {/* Price + primary action */}
      <Card variant="accent" className="mb-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="font-display text-4xl font-semibold">
              {money(PLUS.monthlyUsd)}
              <span className="text-base font-normal text-muted"> / month</span>
            </p>
            <p className="mt-1 text-sm text-muted">
              or {money(PLUS.yearlyUsd)} / year, saving {annualSavingPercent()}%. Starts with a {PLUS.trialDays}-day
              free trial. Cancel anytime.
            </p>
          </div>
          <div>
            {isPlus ? (
              <div>
                <p className="mb-2 text-sm font-medium text-accent">You are on OneSky Plus. Thank you.</p>
                <ManageSubscriptionButton />
              </div>
            ) : user ? (
              <StartTrialButton />
            ) : (
              <Link
                href="/login?next=/plus"
                className="inline-block rounded-lg bg-horizon-amber px-5 py-2.5 text-sm font-semibold text-ink transition hover:brightness-110"
              >
                Create an account to start
              </Link>
            )}
          </div>
        </div>
      </Card>

      {/* Honest free vs Plus comparison */}
      <div className="overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface/40 text-left">
              <th className="px-4 py-3 font-semibold">What you get</th>
              <th className="px-4 py-3 font-semibold">Free</th>
              <th className="px-4 py-3 font-semibold text-accent">Plus</th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON.map((row) => (
              <tr key={row.feature} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-3 text-foreground/90">{row.feature}</td>
                <td className="px-4 py-3 text-muted">{row.free}</td>
                <td className="px-4 py-3 font-medium text-foreground">{row.plus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 space-y-3 text-sm leading-relaxed text-muted">
        <p>
          The core promise does not change. Anyone can compute their chart and read the full basic reading, free, with
          no account. Free accounts can save up to {FREE_LIMITS.savedCharts} charts and run resonance{" "}
          {FREE_LIMITS.resonanceRuns} times.
        </p>
        <p>
          Your birth data stays yours. Payments are handled by Stripe, which never sees your chart, and you can cancel in
          two taps from the billing portal. See our{" "}
          <Link href="/privacy" className="text-accent hover:underline">
            privacy page
          </Link>{" "}
          for what we store and why.
        </p>
      </div>
    </SiteShell>
  );
}
