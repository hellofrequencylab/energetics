import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProfile, recentBirthEvents } from "@/lib/db/queries";
import { SiteShell } from "@/components/site/SiteShell";
import { ProfileOnboarding } from "@/components/account/ProfileOnboarding";
import { AccountTypeSwitch } from "@/components/account/AccountTypeSwitch";
import { DisplayNameEditor } from "@/components/account/DisplayNameEditor";
import { ChartRoster } from "@/components/account/ChartRoster";
import { AddChartPanel } from "@/components/account/AddChartPanel";

export const metadata: Metadata = { title: "Your account · ONESKY" };
export const runtime = "nodejs";

const card =
  "block h-full rounded-[14px] border border-white/10 bg-dusk/25 p-5 transition duration-[200ms] hover:-translate-y-0.5 hover:border-horizon-amber/40 hover:bg-dusk/40";

function SignOut() {
  return (
    <form action="/auth/signout" method="post">
      <button className="rounded-[10px] border border-white/15 px-3 py-1.5 text-sm text-star/75 transition hover:border-horizon-amber/40 hover:text-star">
        Sign out
      </button>
    </form>
  );
}

export default async function AccountPage() {
  const supabase = await createClient();
  if (!supabase) {
    return (
      <SiteShell width="max-w-3xl">
        <p className="text-star/70">Accounts are not configured yet.</p>
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
      <SiteShell width="max-w-3xl">
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
    <SiteShell>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-horizon-amber">
            {practitioner ? "Practitioner" : "Personal"} account
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
            {profile.display_name ? `Welcome, ${profile.display_name}` : "Your account"}
          </h1>
          <p className="mt-2 max-w-xl text-star/80">
            {practitioner
              ? "Keep the charts you read for others, with private notes, and compare any two."
              : "Your charts and the people you are connected to, in one sky."}
          </p>
        </div>
        <div className="hidden shrink-0 items-center gap-3 sm:flex">
          {user.email && <span className="text-sm text-star/60">{user.email}</span>}
          <SignOut />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-end gap-x-8 gap-y-5">
        <AccountTypeSwitch current={profile.account_type} />
        <DisplayNameEditor initial={profile.display_name ?? ""} />
        <div className="sm:hidden">
          <SignOut />
        </div>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <Link href="/synastry" className={card}>
          <div className="font-display text-lg font-semibold">Resonance</div>
          <p className="mt-1 text-sm text-star/70">Compare two charts: platonic or intimate.</p>
        </Link>
        <Link href="/glossary" className={card}>
          <div className="font-display text-lg font-semibold">Glossary</div>
          <p className="mt-1 text-sm text-star/70">Look up any sign, planet, number, or card.</p>
        </Link>
        {profile.is_admin && (
          <Link href="/admin/systems" className={card}>
            <div className="font-display text-lg font-semibold">Systems (admin)</div>
            <p className="mt-1 text-sm text-star/70">Switch which systems are offered on or off.</p>
          </Link>
        )}
      </div>

      {mySky && (
        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold">My Sky</h2>
          <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-horizon-amber/30 bg-horizon-amber/5 p-5">
            <div className="min-w-0">
              <div className="truncate font-medium text-star">★ {mySky.name || "Your chart"}</div>
              <div className="mt-0.5 font-mono text-xs text-star/60">
                {mySky.date}
                {mySky.time ? ` · ${String(mySky.time).slice(0, 5)}` : ""} · {mySky.precision}
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Link
                href={`/account/chart/${mySky.id}`}
                className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-star/80 transition hover:text-star"
              >
                Open
              </Link>
              <Link
                href={`/account/chart/${mySky.id}#edit`}
                className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-star/80 transition hover:text-star"
              >
                Edit
              </Link>
              <Link
                href={`/synastry?a=${mySky.id}`}
                className="rounded-lg bg-horizon-amber px-3 py-1.5 text-sm font-semibold text-ink [text-shadow:0_1px_0_rgba(255,255,255,0.5)] transition hover:brightness-110"
              >
                Compare
              </Link>
            </div>
          </div>
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
