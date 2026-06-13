import { NextResponse } from "next/server";
import { intake } from "@/lib/core/birth-event";
import { computeChart } from "@/lib/compute";
import { synthesize } from "@/lib/synthesis";

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
    const { computations, unavailable, ephemerisVersion } = computeChart(event);
    const synthesis = synthesize(event.id, computations);
    return NextResponse.json({ event, name, computations, unavailable, synthesis, ephemerisVersion });
  } catch (err) {
    return NextResponse.json(
      { error: "Computation failed.", details: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
