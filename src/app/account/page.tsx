import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { recentBirthEvents, listResonances, listSavedCharts } from "@/lib/db/queries";
import { currentUser, currentProfile } from "@/lib/auth/session";
import { SiteShell } from "@/components/site/SiteShell";
import { AppSectionNav } from "@/components/site/AppSectionNav";
import Link from "next/link";
import { PageHeader, Card, Badge, Button, ButtonLink } from "@/components/ui";
import { ProfileOnboarding } from "@/components/account/ProfileOnboarding";
import { AccountTypeSwitch } from "@/components/account/AccountTypeSwitch";
import { DisplayNameEditor } from "@/components/account/DisplayNameEditor";
import { ChangePasswordForm } from "@/components/account/ChangePasswordForm";
import { ChartRoster } from "@/components/account/ChartRoster";
import { AddChartPanel } from "@/components/account/AddChartPanel";
import { ResonanceRoster } from "@/components/account/ResonanceRoster";
import { getEntitlement } from "@/lib/billing/entitlement";
import { ManageSubscriptionButton } from "@/components/billing/BillingButtons";
import { PLUS } from "@/lib/billing/plans";

export const metadata: Metadata = { title: "Your account", robots: { index: false, follow: false } };
export const runtime = "nodejs";

function SignOut() {
  return (
    <form action="/auth/signout" method="post">
      <Button type="submit" variant="secondary" size="sm">
        Sign out
      </Button>
    </form>
  );
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const { checkout } = await searchParams;
  const supabase = await createClient();
  if (!supabase) {
    return (
      <SiteShell>
        <p className="text-muted">Accounts are not configured yet.</p>
      </SiteShell>
    );
  }

  const user = await currentUser();
  if (!user) redirect("/login?next=/account");

  const profile = await currentProfile();

  if (!profile) {
    return (
      <SiteShell>
        <ProfileOnboarding />
      </SiteShell>
    );
  }

  const charts = (await recentBirthEvents(supabase).catch(() => [])) ?? [];
  const resonances = (await listResonances(supabase).catch(() => [])) ?? [];
  const nameSource = resonances.length ? await listSavedCharts(supabase).catch(() => []) : [];
  const nameOf = new Map(nameSource.map((c) => [c.id, c.name]));
  const resonanceItems = resonances.map((r) => ({
    id: r.id,
    mode: r.mode,
    label: r.label,
    aChartId: r.a_chart_id,
    bChartId: r.b_chart_id,
    aName: nameOf.get(r.a_chart_id) ?? null,
    bName: nameOf.get(r.b_chart_id) ?? null,
  }));
  const isPlus = (await getEntitlement()) === "plus";
  const practitioner = profile.account_type === "practitioner";
  const rosterLabel = practitioner ? "Clients" : "People";
  const addLabel = practitioner ? "Add a client" : "Add a chart";
  const mySky = profile.primary_chart_id
    ? charts.find((c) => c.id === profile.primary_chart_id)
    : undefined;

  return (
    <SiteShell nav={<AppSectionNav />}>
      <PageHeader
        eyebrow={`${practitioner ? "Practitioner" : "Personal"} account`}
        title={profile.display_name ? `Welcome, ${profile.display_name}` : "Your account"}
        description={
          practitioner
            ? "Keep the charts you read for others, with private notes, and compare any two."
            : "Your charts and the people you are connected to, in one sky."
        }
        actions={
          <div className="hidden items-center gap-3 sm:flex">
            {user.email && <span className="text-sm text-muted">{user.email}</span>}
            <SignOut />
          </div>
        }
      />

      <div className="flex flex-wrap items-end gap-x-8 gap-y-5">
        <AccountTypeSwitch current={profile.account_type} />
        <DisplayNameEditor initial={profile.display_name ?? ""} />
        <div className="sm:hidden">
          <SignOut />
        </div>
      </div>

      {checkout === "success" && (
        <Card variant="accent" className="mt-8">
          <p className="text-sm font-medium text-accent">You are on OneSky Plus. Welcome in, and thank you.</p>
        </Card>
      )}

      <section className="mt-8">
        <h2 className="font-display text-xl font-semibold">Membership</h2>
        <Card className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant={isPlus ? "accent" : "neutral"}>{isPlus ? "OneSky Plus" : "Free"}</Badge>
            </div>
            <p className="mt-2 max-w-prose text-sm text-muted">
              {isPlus
                ? "Full depth across every tradition, unlimited resonance, and the day's sky. Manage or cancel anytime."
                : `Your chart and basic reading are free. OneSky Plus opens the depth, with a ${PLUS.trialDays}-day free trial.`}
            </p>
          </div>
          <div className="shrink-0">
            {isPlus ? <ManageSubscriptionButton /> : <ButtonLink href="/plus">See OneSky Plus</ButtonLink>}
          </div>
        </Card>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-xl font-semibold">Password</h2>
        <p className="mt-1 max-w-prose text-sm text-muted">
          Set a new password for {user.email ? user.email : "your account"}. It takes effect right
          away, so use the new one the next time you sign in.
        </p>
        <Card className="mt-3">
          <ChangePasswordForm />
        </Card>
      </section>

      <div className="mt-8">
        <Link href="/glossary" className="block">
          <Card interactive>
            <div className="font-display text-lg font-semibold">Glossary</div>
            <p className="mt-1 text-sm text-muted">
              Look up any sign, planet, number, or card.
            </p>
          </Card>
        </Link>
      </div>

      {mySky && (
        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold">My Sky</h2>
          <Card variant="accent" className="mt-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Badge variant="accent">★ My Sky</Badge>
                <span className="truncate font-medium text-foreground">
                  {mySky.name || "Your chart"}
                </span>
              </div>
              <div className="mt-1 font-mono text-xs text-muted">
                {mySky.date}
                {mySky.time ? ` · ${String(mySky.time).slice(0, 5)}` : ""} · {mySky.precision}
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <ButtonLink href={`/account/chart/${mySky.id}`} variant="secondary" size="sm">
                Open
              </ButtonLink>
              <ButtonLink href={`/account/chart/${mySky.id}#edit`} variant="secondary" size="sm">
                Edit
              </ButtonLink>
              <ButtonLink href={`/synastry?a=${mySky.id}`} variant="primary" size="sm">
                Compare
              </ButtonLink>
            </div>
          </Card>
        </section>
      )}

      <section id="add" className="mt-10 scroll-mt-24">
        <AddChartPanel
          noun={practitioner ? "client" : "chart"}
          submitLabel={practitioner ? "Add client to roster" : "Add chart to your sky"}
        />
      </section>

      <section className="mt-12">
        <h2 className="font-display text-xl font-semibold">{rosterLabel}</h2>
        <ChartRoster
          charts={charts}
          addHref="#add"
          addLabel={addLabel}
          noun={practitioner ? "client" : "person"}
          primaryChartId={profile.primary_chart_id}
        />
      </section>

      {resonanceItems.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-xl font-semibold">Saved resonances</h2>
          <p className="mt-1 text-sm text-muted">Comparisons you saved. Open one to read it again.</p>
          <ResonanceRoster items={resonanceItems} />
        </section>
      )}
    </SiteShell>
  );
}
