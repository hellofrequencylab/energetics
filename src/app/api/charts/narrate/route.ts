import { intake } from "@/lib/core/birth-event";
import { computeChart } from "@/lib/compute";
import { synthesize } from "@/lib/synthesis";
import { effectiveEnabledIds } from "@/lib/core/system-settings";
import { chartNarration } from "@/lib/synthesis/narrative";
import { streamNarration } from "@/lib/synthesis/narrate-stream";

import { rateLimitShared, tooManyRequests } from "@/lib/rate-limit";
export const runtime = "nodejs";
// The reading streams with adaptive thinking; allow time for the model.
export const maxDuration = 120;

/**
 * POST /api/charts/narrate
 * Body: birth intake. Recomputes (cheap), runs the deterministic synthesis, then
 * streams the prose NARRATIVE layer over it as text/plain. Cached per synthesis
 * so reopening a chart is instant and never re-bills. Separate from /compute so
 * the structural map renders immediately and the prose loads on demand.
 */
export async function POST(request: Request) {
  const rl = await rateLimitShared(request, { key: "ai", limit: 10, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl.retryAfter);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON body.", { status: 400 });
  }

  let event;
  try {
    ({ event } = intake(body));
  } catch (err) {
    return new Response(`Validation failed. ${err instanceof Error ? err.message : String(err)}`, { status: 422 });
  }

  const only = await effectiveEnabledIds();
  const { computations } = computeChart(event, { only });
  const synthesis = synthesize(event.id, computations);
  return streamNarration("chart", chartNarration(synthesis, computations));
}
