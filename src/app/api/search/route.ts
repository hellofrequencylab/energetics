import { NextResponse } from "next/server";
import { searchCorpus } from "@/lib/corpus/search";

export const runtime = "nodejs";

/** GET /api/search?q= — search the interpretation corpus (quick + deep tiers). */
export function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  if (!q.trim()) return NextResponse.json({ results: [] });
  return NextResponse.json({ results: searchCorpus(q) });
}
