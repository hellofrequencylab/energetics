import { NextResponse } from "next/server";
import { intake } from "@/lib/core/birth-event";
import { computeChart } from "@/lib/compute";
import { effectiveEnabledIds } from "@/lib/core/system-settings";
import { computeSynastry } from "@/lib/synastry";

import { rateLimit, tooManyRequests } from "@/lib/rate-limit";
export const runtime = "nodejs";

/**
 * POST /api/synastry
 * Body: { a: birthIntake, b: birthIntake }. Computes both charts and returns
 * cross-chart aspects, shared ontology emphases, and complementary tensions.
 */
export async function POST(request: Request) {
  const rl = rateLimit(request, { key: "compute", limit: 20, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl.retryAfter);
  let body: { a?: unknown; b?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  let eventA, eventB, nameA, nameB;
  try {
    ({ event: eventA, name: nameA } = intake(body.a));
    ({ event: eventB, name: nameB } = intake(body.b));
  } catch (err) {
    return NextResponse.json(
      { error: "Validation failed.", details: err instanceof Error ? err.message : String(err) },
      { status: 422 },
    );
  }

  try {
    const only = await effectiveEnabledIds();
    const a = computeChart(eventA, { only });
    const b = computeChart(eventB, { only });
    const synastry = computeSynastry(a.computations, b.computations);
    return NextResponse.json({
      a: { name: nameA, event: eventA },
      b: { name: nameB, event: eventB },
      synastry,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Synastry computation failed.", details: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
