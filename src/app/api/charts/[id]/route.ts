import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deleteBirthEvent, updateBirthEvent } from "@/lib/db/queries";

export const runtime = "nodejs";

/** PATCH /api/charts/:id: rename a saved chart or update its notes. RLS-scoped. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Not configured." }, { status: 503 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  let body: { name?: unknown; notes?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const input: { name?: string | null; notes?: string | null } = {};
  if (typeof body.name === "string") input.name = body.name.trim() || null;
  if (typeof body.notes === "string") input.notes = body.notes;

  try {
    await updateBirthEvent(supabase, id, input);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not save." },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true });
}

/** DELETE /api/charts/:id: remove a saved chart. RLS-scoped. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Not configured." }, { status: 503 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  try {
    await deleteBirthEvent(supabase, id);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not delete." },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true });
}
