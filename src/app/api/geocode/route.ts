import { NextResponse } from "next/server";
import { geocodePlace } from "@/lib/geocode";

import { rateLimit, tooManyRequests } from "@/lib/rate-limit";
export const runtime = "nodejs";

/** GET /api/geocode?q=Ulm — place search → coordinates + timezone candidates. */
export async function GET(request: Request) {
  const rl = rateLimit(request, { key: "geocode", limit: 40, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl.retryAfter);
  const q = (new URL(request.url).searchParams.get("q") ?? "").slice(0, 200);
  if (!q.trim()) return NextResponse.json({ results: [] });
  try {
    const results = await geocodePlace(q);
    return NextResponse.json({ results });
  } catch (err) {
    console.error("geocode failed", err);
    return NextResponse.json({ results: [], error: "Geocoding unavailable." }, { status: 502 });
  }
}
