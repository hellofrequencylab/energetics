import { intake } from "@/lib/core/birth-event";
import { computeChart } from "@/lib/compute";
import { effectiveEnabledIds } from "@/lib/core/system-settings";
import { computeSynastry } from "@/lib/synastry";
import { resonanceNarration, type ResonanceMode } from "@/lib/synthesis/narrative";
import { streamNarration } from "@/lib/synthesis/narrate-stream";

import { rateLimitShared, tooManyRequests } from "@/lib/rate-limit";
export const runtime = "nodejs";
// The reading streams with adaptive thinking; allow time for the model.
export const maxDuration = 120;

/**
 * POST /api/synastry/narrate
 * Body: { a: birthIntake, b: birthIntake, mode: "platonic" | "intimate" }.
 * Computes both charts, runs the deterministic resonance comparison, then streams
 * the prose reading over it through the chosen lens. Cached per comparison + lens.
 */
export async function POST(request: Request) {
  const rl = await rateLimitShared(request, { key: "ai", limit: 10, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl.retryAfter);
  let body: { a?: unknown; b?: unknown; mode?: string };
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON body.", { status: 400 });
  }

  let eventA, eventB, nameA, nameB;
  try {
    ({ event: eventA, name: nameA } = intake(body.a));
    ({ event: eventB, name: nameB } = intake(body.b));
  } catch (err) {
    return new Response(`Validation failed. ${err instanceof Error ? err.message : String(err)}`, { status: 422 });
  }

  const only = await effectiveEnabledIds();
  const a = computeChart(eventA, { only });
  const b = computeChart(eventB, { only });
  const synastry = computeSynastry(a.computations, b.computations);
  const mode: ResonanceMode = body.mode === "intimate" ? "intimate" : "platonic";

  return streamNarration(
    "resonance",
    resonanceNarration({ mode, aName: nameA ?? "", bName: nameB ?? "", result: synastry }),
  );
}
