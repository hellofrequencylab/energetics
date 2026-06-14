import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProfile, recentBirthEvents } from "@/lib/db/queries";
import { ConvergenceGraph } from "@/components/marketing/ConvergenceGraph";
import { ProfileOnboarding } from "@/components/account/ProfileOnboarding";
import { AccountTypeSwitch } from "@/components/account/AccountTypeSwitch";

export const metadata: Metadata = { title: "Your account · ONESKY" };
export const runtime = "nodejs";

function Header({ email }: { email?: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-midnight/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-3">
        <Link href="/welcome" className="flex items-center gap-2" aria-label="OneSky home">
          <ConvergenceGraph animated={false} className="h-6 w-8" label="OneSky" />
          <span className="text-sm font-semibold uppercase tracking-[0.3em]">ONESKY</span>
        </Link>
        <div className="flex items-center gap-3 text-sm text-star/70">
          {email && <span className="hidden sm:inline">{email}</span>}
          <form action="/auth/signout" method="post">
            <button className="rounded-[10px] border border-white/15 px-3 py-1.5 transition hover:text-star">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}

const card =
  "block h-full rounded-[14px] border border-white/10 bg-dusk/25 p-5 transition duration-[200ms] hover:-translate-y-0.5 hover:border-horizon-amber/40 hover:bg-dusk/40";

export default async function AccountPage() {
  const supabase = await createClient();
  if (!supabase) {
    return (
      <div className="min-h-screen bg-midnight text-star">
        <Header />
        <main className="mx-auto max-w-3xl px-5 py-16 text-star/70">
          Accounts are not configured yet.
        </main>
      </div>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account");

  const profile = await getProfile(supabase, user.id).catch(() => null);

  if (!profile) {
    return (
      <div className="min-h-screen bg-midnight text-star">
        <Header email={user.email ?? undefined} />
        <main className="mx-auto max-w-3xl px-5 py-16">
          <ProfileOnboarding />
        </main>
      </div>
    );
  }

  const charts = (await recentBirthEvents(supabase).catch(() => [])) ?? [];
  const practitioner = profile.account_type === "practitioner";
  const rosterLabel = practitioner ? "Clients" : "People";
  const addLabel = practitioner ? "Add a client" : "Add a chart";

  return (
    <div className="min-h-screen bg-midnight text-star">
      <Header email={user.email ?? undefined} />
      <main className="mx-auto max-w-5xl px-5 py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-horizon-amber">
          {practitioner ? "Practitioner" : "Personal"} account
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">Your account</h1>
        <p className="mt-2 max-w-xl text-star/70">
          {practitioner
            ? "Keep the charts you read for others, with private notes, and compare any two."
            : "Your charts and the people you are connected to, in one sky."}
        </p>

        <div className="mt-6">
          <AccountTypeSwitch current={profile.account_type} />
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <Link href="/welcome" className={card}>
            <div className="font-display text-lg font-semibold">{addLabel}</div>
            <p className="mt-1 text-sm text-star/65">
              Compute a new chart, saved to your {practitioner ? "roster" : "people"}.
            </p>
          </Link>
          <Link href="/synastry" className={card}>
            <div className="font-display text-lg font-semibold">Resonance</div>
            <p className="mt-1 text-sm text-star/65">Compare two charts: platonic or intimate.</p>
          </Link>
          <Link href="/glossary" className={card}>
            <div className="font-display text-lg font-semibold">Glossary</div>
            <p className="mt-1 text-sm text-star/65">Look up any sign, planet, number, or card.</p>
          </Link>
        </div>

        <section className="mt-12">
          <h2 className="font-display text-xl font-semibold">{rosterLabel}</h2>
          {charts.length === 0 ? (
            <p className="mt-4 rounded-xl border border-white/10 bg-dusk/20 p-6 text-sm text-star/60">
              No charts yet.{" "}
              <Link className="text-horizon-amber underline underline-offset-4" href="/welcome">
                {addLabel}
              </Link>{" "}
              to begin.
            </p>
          ) : (
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {charts.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/account/chart/${c.id}`}
                    className="block rounded-xl border border-white/10 bg-dusk/20 p-4 transition hover:-translate-y-0.5 hover:border-horizon-amber/40 hover:bg-dusk/40"
                  >
                    <div className="font-medium">{c.name || "Unnamed chart"}</div>
                    <div className="mt-0.5 font-mono text-xs text-star/50">
                      {c.date}
                      {c.time ? ` · ${String(c.time).slice(0, 5)}` : ""} · {c.precision}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
