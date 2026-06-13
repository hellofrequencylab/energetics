import { NextResponse } from "next/server";
import { intake } from "@/lib/core/birth-event";
import { computeChart } from "@/lib/compute";
import { computeSynastry } from "@/lib/synastry";

export const runtime = "nodejs";

/**
 * POST /api/synastry
 * Body: { a: birthIntake, b: birthIntake }. Computes both charts and returns
 * cross-chart aspects, shared ontology emphases, and complementary tensions.
 */
export async function POST(request: Request) {
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
    const a = computeChart(eventA);
    const b = computeChart(eventB);
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
