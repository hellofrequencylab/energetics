import { NextResponse } from "next/server";
import { searchCorpus } from "@/lib/corpus/search";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";

export const runtime = "nodejs";

/** GET /api/search?q= — search the interpretation corpus (quick + deep tiers). */
export function GET(request: Request) {
  const rl = rateLimit(request, { key: "search", limit: 60, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl.retryAfter);
  const q = (new URL(request.url).searchParams.get("q") ?? "").slice(0, 200);
  if (!q.trim()) return NextResponse.json({ results: [] });
  return NextResponse.json({ results: searchCorpus(q) });
}
