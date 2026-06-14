import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getBirthEvent, getProfile } from "@/lib/db/queries";
import { intake } from "@/lib/core/birth-event";
import { computeChart } from "@/lib/compute";
import { synthesize } from "@/lib/synthesis";
import type { ComputeResponse } from "@/lib/api-types";
import { SynthesisView } from "@/components/SynthesisView";
import { ConvergenceGraph } from "@/components/marketing/ConvergenceGraph";
import { ChartManager } from "@/components/account/ChartManager";
import { EditBirthData } from "@/components/account/EditBirthData";

export const runtime = "nodejs";

/** A saved chart, recomputed server-side from its stored birth data and shown in the reader. */
export default async function SavedChartPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  if (!supabase) redirect("/login?next=/account");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/account/chart/${id}`);

  const row = await getBirthEvent(supabase, id).catch(() => null);
  if (!row) notFound();

  const body: Record<string, unknown> = { date: row.date };
  if (row.name) body.name = row.name;
  if (row.time) body.time = String(row.time).slice(0, 5);
  if (row.lat != null && row.lng != null) {
    body.place = { lat: row.lat, lng: row.lng, ...(row.tz ? { tz: row.tz } : {}) };
  }

  const { event, name } = intake(body);
  const { computations, unavailable, ephemerisVersion } = computeChart(event);
  const synthesis = synthesize(event.id, computations);
  const data: ComputeResponse = { event, name, computations, unavailable, synthesis, ephemerisVersion };

  const profile = await getProfile(supabase, user.id).catch(() => null);
  const practitioner = profile?.account_type === "practitioner";

  return (
    <div className="min-h-screen bg-midnight text-star">
      <header className="sticky top-0 z-30 border-b border-white/5 bg-midnight/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-3">
          <Link href="/welcome" className="flex items-center gap-2" aria-label="OneSky home">
            <ConvergenceGraph animated={false} className="h-6 w-8" label="OneSky" />
            <span className="text-sm font-semibold uppercase tracking-[0.3em]">ONESKY</span>
          </Link>
          <Link href="/account" className="text-sm text-star/70 transition hover:text-star">
            Account
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-10">
        <Link href="/account" className="text-sm text-star/60 transition hover:text-star">
          ← Back to account
        </Link>
        <h1 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
          {row.name || "Saved chart"}
        </h1>

        <div className="mt-6 grid gap-4">
          <ChartManager
            id={row.id}
            initialName={row.name ?? ""}
            initialNotes={row.notes ?? ""}
            practitioner={practitioner}
            isPrimary={profile?.primary_chart_id === row.id}
            primaryChartId={profile?.primary_chart_id ?? null}
          />
          <EditBirthData
            id={row.id}
            date={row.date}
            time={row.time}
            lat={row.lat}
            lng={row.lng}
            tz={row.tz}
          />
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-background/60 p-5 sm:p-6">
          <SynthesisView data={data} intakeBody={body} />
        </div>
      </main>
    </div>
  );
}
