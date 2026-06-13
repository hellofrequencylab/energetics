import { NextResponse } from "next/server";
import { lookup, type CorpusKind } from "@/lib/corpus";

export const runtime = "nodejs";

const KINDS: CorpusKind[] = ["sign", "planet", "number", "daysign", "tone", "arcana"];

/** GET /api/interpretations/:kind/:key — quick-guide for a single factor value. */
export async function GET(_req: Request, ctx: { params: Promise<{ kind: string; key: string }> }) {
  const { kind, key } = await ctx.params;
  if (!KINDS.includes(kind as CorpusKind)) {
    return NextResponse.json({ error: `Unknown kind. Use: ${KINDS.join(", ")}` }, { status: 404 });
  }
  const quickGuide = lookup(kind as CorpusKind, decodeURIComponent(key));
  if (!quickGuide) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ kind, key, quickGuide });
}
