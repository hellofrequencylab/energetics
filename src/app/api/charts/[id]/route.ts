import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deleteBirthEvent, updateBirthEvent } from "@/lib/db/queries";
import { intake } from "@/lib/core/birth-event";

export const runtime = "nodejs";

/**
 * PATCH /api/charts/:id: update a saved chart. RLS-scoped. Accepts metadata
 * (name, notes) and/or the birth data (date, time, place). When the birth data
 * changes, it is run through `intake()` so the timezone and precision are derived
 * the same way as on compute, and the reader recomputes from it on next load.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Not configured." }, { status: 503 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  let body: { name?: unknown; notes?: unknown; date?: unknown; time?: unknown; place?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const input: Parameters<typeof updateBirthEvent>[3] = {};
  if (typeof body.name === "string") input.name = body.name.trim() || null;
  if (typeof body.notes === "string") input.notes = body.notes;

  // A birth-data edit: validate and derive the canonical event, then map it to
  // the row columns. The chart id stays the same; only its data changes.
  if (typeof body.date === "string") {
    let event;
    try {
      ({ event } = intake({
        date: body.date,
        ...(typeof body.time === "string" && body.time ? { time: body.time } : {}),
        ...(body.place && typeof body.place === "object" ? { place: body.place } : {}),
      }));
    } catch (err) {
      return NextResponse.json(
        { error: "Validation failed.", details: err instanceof Error ? err.message : String(err) },
        { status: 422 },
      );
    }
    input.date = event.date;
    input.time = event.time ?? null;
    input.lat = event.place?.lat ?? null;
    input.lng = event.place?.lng ?? null;
    input.tz = event.place?.tz ?? null;
    input.precision = event.precision;
  }

  try {
    await updateBirthEvent(supabase, user.id, id, input);
  } catch (err) {
    console.error("charts PATCH failed", err);
    return NextResponse.json({ error: "Could not save." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

/** DELETE /api/charts/:id: remove a saved chart. RLS-scoped. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Not configured." }, { status: 503 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  try {
    await deleteBirthEvent(supabase, user.id, id);
  } catch (err) {
    console.error("charts DELETE failed", err);
    return NextResponse.json({ error: "Could not delete." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
