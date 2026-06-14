import { NextResponse } from "next/server";
import { intake } from "@/lib/core/birth-event";
import { computeChart } from "@/lib/compute";
import { synthesize } from "@/lib/synthesis";
import { effectiveEnabledIds, effectiveOrderMap, sortByOrder } from "@/lib/core/system-settings";
import { createClient } from "@/lib/supabase/server";
import { persistChart } from "@/lib/db/queries";

// Ephemeris is a native addon — must run on the Node runtime.
export const runtime = "nodejs";

/**
 * POST /api/charts/compute
 * Body: birth intake. Runs every satisfiable engine + adapter, then the
 * DETERMINISTIC synthesis. Fast (no LLM). The narrative is a separate endpoint.
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

  try {
    const only = await effectiveEnabledIds();
    const { computations, unavailable, ephemerisVersion } = computeChart(event, { only });
    const synthesis = synthesize(event.id, computations);

    // Best-effort cache to Supabase for signed-in users — never blocks the
    // response or fails the request if persistence is unavailable.
    await cacheChart({ event, name, computations, synthesis, ephemerisVersion });

    // Display order follows the admin's catalog order. Synthesis and the
    // narration cache key stay on the stable registry order computed above.
    const order = await effectiveOrderMap();
    const ordered = sortByOrder(computations, (c) => c.meta.id, order);

    return NextResponse.json({ event, name, computations: ordered, unavailable, synthesis, ephemerisVersion });
  } catch (err) {
    return NextResponse.json(
      { error: "Computation failed.", details: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

async function cacheChart(input: Parameters<typeof persistChart>[2]): Promise<void> {
  try {
    const supabase = await createClient();
    if (!supabase) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await persistChart(supabase, user.id, input);
  } catch {
    // Persistence is best-effort; computation already succeeded.
  }
}
