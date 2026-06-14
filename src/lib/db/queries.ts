/**
 * Persistence for the synthesis engine (spec §10). All writes are owner-scoped
 * (RLS enforces user_id). These run best-effort: callers swallow errors so a
 * persistence failure never breaks chart computation.
 */
import type { createClient } from "@/lib/supabase/server";
import type { BirthEvent } from "@/lib/core/birth-event";
import type { ComputedSystem, Synthesis } from "@/lib/synthesis/types";

/**
 * The Supabase client these helpers operate on, derived from the factory so the
 * `energetics` schema typing (db.schema) stays in sync automatically. Both the
 * server and browser clients share this shape.
 */
type DbClient = NonNullable<Awaited<ReturnType<typeof createClient>>>;

export interface PersistChartInput {
  event: BirthEvent;
  name?: string;
  computations: ComputedSystem[];
  synthesis: Synthesis;
  ephemerisVersion: string;
}

/**
 * Persist a full chart: the birth event, each system's cached native result +
 * denormalized primitives, and the synthesis snapshot. Idempotent-ish via the
 * birth event id; returns the birth_event id.
 */
export async function persistChart(
  supabase: DbClient,
  userId: string,
  { event, name, computations, synthesis, ephemerisVersion }: PersistChartInput,
): Promise<string> {
  const { data: be, error: beErr } = await supabase
    .from("birth_events")
    .upsert(
      {
        id: event.id,
        user_id: userId,
        name: name ?? null,
        date: event.date,
        time: event.time ?? null,
        lat: event.place?.lat ?? null,
        lng: event.place?.lng ?? null,
        tz: event.place?.tz ?? null,
        precision: event.precision,
      },
      { onConflict: "id" },
    )
    .select("id")
    .single();
  if (beErr) throw beErr;
  const birthEventId = be.id as string;

  for (const c of computations) {
    const { data: cc, error: ccErr } = await supabase
      .from("chart_computations")
      .upsert(
        {
          birth_event_id: birthEventId,
          system_id: c.meta.id,
          ephemeris_version: ephemerisVersion,
          corpus_version: c.meta.corpusVersion,
          native: c.native,
        },
        { onConflict: "birth_event_id,system_id,ephemeris_version,corpus_version" },
      )
      .select("id")
      .single();
    if (ccErr) throw ccErr;

    // Refresh denormalized primitives for this computation.
    await supabase.from("system_primitives").delete().eq("computation_id", cc.id);
    if (c.primitives.length) {
      await supabase.from("system_primitives").insert(
        c.primitives.map((p) => ({
          computation_id: cc.id,
          axis: p.axis,
          value: p.value,
          weight: p.weight,
          source: p.source,
          derived_from: p.derivedFrom,
          native_factor: p.native.factorKey,
        })),
      );
    }
  }

  await supabase.from("syntheses").insert({
    birth_event_id: birthEventId,
    ontology_version: synthesis.ontologyVersion,
    convergences: synthesis.convergences,
    tensions: synthesis.tensions,
  });

  return birthEventId;
}

/** Recent birth events for the signed-in user. */
export async function recentBirthEvents(supabase: DbClient, limit = 20) {
  const { data, error } = await supabase
    .from("birth_events")
    .select("id, name, date, time, precision, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}
