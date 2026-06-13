import { NextResponse } from "next/server";
import { intake } from "@/lib/core/birth-event";
import { computeChart } from "@/lib/compute";
import { synthesize } from "@/lib/synthesis";
import { narrate } from "@/lib/synthesis/narrative";

export const runtime = "nodejs";
// Narrative uses adaptive thinking + streaming; allow time for the model.
export const maxDuration = 120;

/**
 * POST /api/charts/narrate
 * Body: birth intake. Recomputes (cheap), runs the deterministic synthesis, then
 * the LLM NARRATIVE layer over it. Separate from /compute so the structural map
 * renders instantly and prose loads on demand.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  let event;
  try {
    ({ event } = intake(body));
  } catch (err) {
    return NextResponse.json(
      { error: "Validation failed.", details: err instanceof Error ? err.message : String(err) },
      { status: 422 },
    );
  }

  const { computations } = computeChart(event);
  const synthesis = synthesize(event.id, computations);
  const narrative = await narrate(synthesis, computations);
  return NextResponse.json({ narrative });
}
