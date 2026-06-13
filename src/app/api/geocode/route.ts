import { NextResponse } from "next/server";
import { geocodePlace } from "@/lib/geocode";

export const runtime = "nodejs";

/** GET /api/geocode?q=Ulm — place search → coordinates + timezone candidates. */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  if (!q.trim()) return NextResponse.json({ results: [] });
  try {
    const results = await geocodePlace(q);
    return NextResponse.json({ results });
  } catch (err) {
    return NextResponse.json(
      { results: [], error: err instanceof Error ? err.message : "Geocoding unavailable." },
      { status: 502 },
    );
  }
}
