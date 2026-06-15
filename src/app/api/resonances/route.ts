import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createResonance, type ResonanceMode } from "@/lib/db/queries";
import { logError } from "@/lib/log";

export const runtime = "nodejs";

/**
 * POST /api/resonances: save a resonance, a pairing of two of the user's saved
 * charts plus the lens. Owner-scoped by RLS.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Accounts are not configured." }, { status: 503 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  let body: { aChartId?: string; bChartId?: string; mode?: string; label?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!body.aChartId || !body.bChartId) {
    return NextResponse.json({ error: "Two saved charts are required." }, { status: 400 });
  }
  const mode: ResonanceMode = body.mode === "intimate" ? "intimate" : "platonic";
  const label = typeof body.label === "string" ? body.label.trim() || null : null;

  // Verify both charts belong to the caller before saving. RLS scopes this select
  // to the user, so a chart they do not own simply will not be returned. This also
  // gives a clean error instead of a foreign-key failure on someone else's id.
  const { data: owned, error: ownErr } = await supabase
    .from("birth_events")
    .select("id")
    .in("id", [body.aChartId, body.bChartId]);
  if (ownErr) {
    logError("resonances.ownership", ownErr);
    return NextResponse.json({ error: "Could not save this resonance." }, { status: 500 });
  }
  const ownedIds = new Set((owned ?? []).map((r) => r.id as string));
  if (!ownedIds.has(body.aChartId) || !ownedIds.has(body.bChartId)) {
    return NextResponse.json({ error: "Both charts must be your own saved charts." }, { status: 403 });
  }

  try {
    const id = await createResonance(supabase, user.id, {
      aChartId: body.aChartId,
      bChartId: body.bChartId,
      mode,
      label,
    });
    return NextResponse.json({ id });
  } catch (err) {
    logError("resonances.create", err);
    return NextResponse.json({ error: "Could not save this resonance." }, { status: 500 });
  }
}
