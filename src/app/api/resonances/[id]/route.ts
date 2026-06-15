import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deleteResonance } from "@/lib/db/queries";

export const runtime = "nodejs";

/** DELETE /api/resonances/[id]: remove a saved resonance. RLS-scoped. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Accounts are not configured." }, { status: 503 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  try {
    await deleteResonance(supabase, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not delete this resonance." },
      { status: 500 },
    );
  }
}
