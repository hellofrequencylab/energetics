import { NextResponse } from "next/server";
import { intake } from "@/lib/core/birth-event";
import { computeChart } from "@/lib/compute";
import { computeTransits } from "@/lib/transits";

export const runtime = "nodejs";

/**
 * POST /api/transits
 * Body: birth intake, plus optional `at` (ISO instant; defaults to now).
 * Returns current transits to the natal chart + seasonal Sun/Moon context.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { at, ...intakeBody } = body;

  let event;
  try {
    ({ event } = intake(intakeBody));
  } catch (err) {
    return NextResponse.json(
      { error: "Validation failed.", details: err instanceof Error ? err.message : String(err) },
      { status: 422 },
    );
  }

  try {
    const { computations } = computeChart(event);
    const western = computations.find((c) => c.meta.id === "western-tropical");
    if (!western) return NextResponse.json({ error: "Natal chart unavailable." }, { status: 500 });
    const transits = computeTransits(western.native, typeof at === "string" ? at : undefined);
    return NextResponse.json({ transits });
  } catch (err) {
    return NextResponse.json(
      { error: "Transit computation failed.", details: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
