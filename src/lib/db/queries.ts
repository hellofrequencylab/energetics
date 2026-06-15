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

export type AccountType = "personal" | "practitioner";

export interface Profile {
  account_type: AccountType;
  display_name: string | null;
  primary_chart_id: string | null;
  is_admin: boolean;
}

/** The signed-in user's profile, or null if they have not chosen one yet. */
export async function getProfile(supabase: DbClient, userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("account_type, display_name, primary_chart_id, is_admin")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data as Profile | null) ?? null;
}

/** Whether the signed-in user is an admin. Safe default of false on any error. */
export async function isAdmin(supabase: DbClient, userId: string): Promise<boolean> {
  const profile = await getProfile(supabase, userId).catch(() => null);
  return profile?.is_admin === true;
}

/** Set a system's enabled override. Admin-only (enforced by RLS). */
export async function setSystemEnabled(
  supabase: DbClient,
  systemId: string,
  enabled: boolean,
): Promise<void> {
  const { error } = await supabase
    .from("system_settings")
    .upsert({ system_id: systemId, enabled, updated_at: new Date().toISOString() }, { onConflict: "system_id" });
  if (error) throw error;
}

/**
 * Persist the catalog display order. Admin-only (enforced by RLS). Writes a
 * `sort_order` per system, leaving each row's `enabled` override untouched (rows
 * created here for never-toggled systems get a null, inherit-default, enabled).
 */
export async function setSystemOrder(supabase: DbClient, orderedIds: string[]): Promise<void> {
  if (orderedIds.length === 0) return;
  const now = new Date().toISOString();
  const rows = orderedIds.map((system_id, i) => ({ system_id, sort_order: i, updated_at: now }));
  const { error } = await supabase.from("system_settings").upsert(rows, { onConflict: "system_id" });
  if (error) throw error;
}

/** Pin (or clear) the user's primary chart, their "My Sky." */
export async function setPrimaryChart(
  supabase: DbClient,
  userId: string,
  chartId: string | null,
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ primary_chart_id: chartId, updated_at: new Date().toISOString() })
    .eq("user_id", userId);
  if (error) throw error;
}

/** Create or update the user's profile (account type is switchable). */
export async function upsertProfile(
  supabase: DbClient,
  userId: string,
  input: { accountType: AccountType; displayName?: string | null },
): Promise<void> {
  const { error } = await supabase.from("profiles").upsert(
    {
      user_id: userId,
      account_type: input.accountType,
      display_name: input.displayName ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;
}

/** Saved charts with the birth data needed to load them into another tool. */
export async function listSavedCharts(supabase: DbClient, limit = 50) {
  const { data, error } = await supabase
    .from("birth_events")
    .select("id, name, date, time, lat, lng, tz")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as {
    id: string;
    name: string | null;
    date: string;
    time: string | null;
    lat: number | null;
    lng: number | null;
    tz: string | null;
  }[];
}

/**
 * Update a saved chart's editable fields. RLS-scoped. Covers the metadata
 * (name, practitioner notes) and the birth data itself (date, time, place, with
 * its derived precision), so a chart can be corrected after saving.
 */
export async function updateBirthEvent(
  supabase: DbClient,
  userId: string,
  id: string,
  input: {
    name?: string | null;
    notes?: string | null;
    date?: string;
    time?: string | null;
    lat?: number | null;
    lng?: number | null;
    tz?: string | null;
    precision?: string;
  },
): Promise<void> {
  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.notes !== undefined) patch.notes = input.notes;
  if (input.date !== undefined) patch.date = input.date;
  if (input.time !== undefined) patch.time = input.time;
  if (input.lat !== undefined) patch.lat = input.lat;
  if (input.lng !== undefined) patch.lng = input.lng;
  if (input.tz !== undefined) patch.tz = input.tz;
  if (input.precision !== undefined) patch.precision = input.precision;
  if (Object.keys(patch).length === 0) return;
  // Defense in depth: scope to the owner explicitly, not RLS alone.
  const { error } = await supabase.from("birth_events").update(patch).eq("id", id).eq("user_id", userId);
  if (error) throw error;
}

/** Delete a saved chart (cascades to its cached computations). RLS-scoped. */
export async function deleteBirthEvent(supabase: DbClient, userId: string, id: string): Promise<void> {
  const { error } = await supabase.from("birth_events").delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;
}

/** A single saved chart with everything needed to recompute it. RLS-scoped. */
export async function getBirthEvent(supabase: DbClient, id: string) {
  const { data, error } = await supabase
    .from("birth_events")
    .select("id, name, date, time, lat, lng, tz, precision, notes")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as {
    id: string;
    name: string | null;
    date: string;
    time: string | null;
    lat: number | null;
    lng: number | null;
    tz: string | null;
    precision: string;
    notes: string | null;
  } | null;
}

// --- Saved resonances ------------------------------------------------------

export type ResonanceMode = "platonic" | "intimate";

export interface SavedResonance {
  id: string;
  a_chart_id: string;
  b_chart_id: string;
  mode: ResonanceMode;
  label: string | null;
  created_at: string;
}

/** Save a resonance: a pairing of two saved charts plus the lens. RLS-scoped. */
export async function createResonance(
  supabase: DbClient,
  userId: string,
  input: { aChartId: string; bChartId: string; mode: ResonanceMode; label?: string | null },
): Promise<string> {
  const { data, error } = await supabase
    .from("resonances")
    .insert({
      user_id: userId,
      a_chart_id: input.aChartId,
      b_chart_id: input.bChartId,
      mode: input.mode,
      label: input.label ?? null,
    })
    .select("id")
    .single();
  if (error) throw error;
  return (data as { id: string }).id;
}

/** The signed-in user's saved resonances, newest first. RLS-scoped. */
export async function listResonances(supabase: DbClient, limit = 50): Promise<SavedResonance[]> {
  const { data, error } = await supabase
    .from("resonances")
    .select("id, a_chart_id, b_chart_id, mode, label, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as SavedResonance[];
}

/** Delete a saved resonance (the underlying charts are untouched). RLS-scoped. */
export async function deleteResonance(supabase: DbClient, userId: string, id: string): Promise<void> {
  const { error } = await supabase.from("resonances").delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;
}
