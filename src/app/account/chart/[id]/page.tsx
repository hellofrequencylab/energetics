import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBirthEvent } from "@/lib/db/queries";
import { currentUser, currentProfile } from "@/lib/auth/session";
import { intake } from "@/lib/core/birth-event";
import { computeChart } from "@/lib/compute";
import { effectiveEnabledIds, effectiveOrderMap, sortByOrder } from "@/lib/core/system-settings";
import { synthesize } from "@/lib/synthesis";
import { chartNarration } from "@/lib/synthesis/narrative";
import { getCachedNarration } from "@/lib/synthesis/narrate-stream";
import type { ComputeResponse } from "@/lib/api-types";
import { SynthesisView } from "@/components/SynthesisView";
import { SiteShell } from "@/components/site/SiteShell";
import { AppSectionNav } from "@/components/site/AppSectionNav";
import { PageHeader } from "@/components/ui";
import { ChartProfile } from "@/components/account/ChartProfile";
import { ChartRecords } from "@/components/account/ChartRecords";

export const runtime = "nodejs";

/** A saved chart, recomputed server-side from its stored birth data and shown in the reader. */
export default async function SavedChartPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  if (!supabase) redirect("/login?next=/account");

  const user = await currentUser();
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
  const only = await effectiveEnabledIds();
  const { computations, unavailable, ephemerisVersion } = computeChart(event, { only });
  const synthesis = synthesize(event.id, computations);

  // A reading already written for this exact synthesis shows at once (no rewrite).
  // Built from the stable registry order, matching the narrate route's cache key.
  const initialReading = await getCachedNarration(chartNarration(synthesis, computations)).catch(() => null);

  // Display order follows the admin's catalog order; synthesis stays as computed.
  const order = await effectiveOrderMap();
  const ordered = sortByOrder(computations, (c) => c.meta.id, order);
  const data: ComputeResponse = { event, name, computations: ordered, unavailable, synthesis, ephemerisVersion };

  const profile = await currentProfile();

  return (
    <SiteShell nav={<AppSectionNav />}>
      <PageHeader title={row.name || "Saved chart"} back={{ href: "/account", label: "Back to account" }} />

      <SynthesisView
        data={data}
        intakeBody={body}
        chartId={row.id}
        initialReading={initialReading}
        rail={
          <ChartProfile
            id={row.id}
            initialName={row.name ?? ""}
            date={row.date}
            time={row.time}
            lat={row.lat}
            lng={row.lng}
            tz={row.tz}
          />
        }
        railAfter={
          <ChartRecords
            id={row.id}
            initialNotes={row.notes ?? ""}
            isPrimary={profile?.primary_chart_id === row.id}
            primaryChartId={profile?.primary_chart_id ?? null}
          />
        }
      />
    </SiteShell>
  );
}
