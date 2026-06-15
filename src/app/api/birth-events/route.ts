import { NextResponse } from "next/server";
import { intake } from "@/lib/core/birth-event";
import { createClient } from "@/lib/supabase/server";
import { recentBirthEvents } from "@/lib/db/queries";
import { logError } from "@/lib/log";

export const runtime = "nodejs";

/**
 * POST /api/birth-events — validate intake, derive precision, persist the birth
 * event for the signed-in user. Returns the BirthEvent.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  let event, name;
  try {
    ({ event, name } = intake(body));
  } catch (err) {
    return NextResponse.json(
      { error: "Validation failed.", details: err instanceof Error ? err.message : String(err) },
      { status: 422 },
    );
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Persistence not configured (Supabase env vars missing)." },
      { status: 503 },
    );
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { error } = await supabase.from("birth_events").upsert(
    {
      id: event.id,
      user_id: user.id,
      name: name ?? null,
      date: event.date,
      time: event.time ?? null,
      lat: event.place?.lat ?? null,
      lng: event.place?.lng ?? null,
      tz: event.place?.tz ?? null,
      precision: event.precision,
    },
    { onConflict: "id" },
  );
  if (error) {
    logError("birth-events.upsert", error);
    return NextResponse.json({ error: "Could not save this chart." }, { status: 500 });
  }

  return NextResponse.json({ event, name });
}

/** GET /api/birth-events — list the signed-in user's saved birth events. */
export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ birthEvents: [] });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ birthEvents: [] });
  try {
    const birthEvents = await recentBirthEvents(supabase);
    return NextResponse.json({ birthEvents });
  } catch (err) {
    logError("birth-events.list", err);
    return NextResponse.json({ birthEvents: [], error: "Query failed." }, { status: 500 });
  }
}
