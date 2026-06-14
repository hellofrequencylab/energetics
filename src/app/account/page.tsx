import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile, recentBirthEvents } from "@/lib/db/queries";
import { SiteShell } from "@/components/site/SiteShell";
import { AppSectionNav } from "@/components/site/AppSectionNav";
import Link from "next/link";
import { PageHeader, Card, Badge, Button, ButtonLink } from "@/components/ui";
import { ProfileOnboarding } from "@/components/account/ProfileOnboarding";
import { AccountTypeSwitch } from "@/components/account/AccountTypeSwitch";
import { DisplayNameEditor } from "@/components/account/DisplayNameEditor";
import { ChartRoster } from "@/components/account/ChartRoster";
import { AddChartPanel } from "@/components/account/AddChartPanel";

export const metadata: Metadata = { title: "Your account · ONESKY" };
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

export default async function AccountPage() {
  const supabase = await createClient();
  if (!supabase) {
    return (
      <SiteShell>
        <p className="text-muted">Accounts are not configured yet.</p>
      </SiteShell>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account");

  const profile = await getProfile(supabase, user.id).catch(() => null);

  if (!profile) {
    return (
      <SiteShell>
        <ProfileOnboarding />
      </SiteShell>
    );
  }

  const charts = (await recentBirthEvents(supabase).catch(() => [])) ?? [];
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
    </SiteShell>
  );
}
