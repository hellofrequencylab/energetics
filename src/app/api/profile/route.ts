import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProfile, upsertProfile } from "@/lib/db/queries";

export const runtime = "nodejs";

/**
 * POST /api/profile: set the account type and/or display name. Partial-safe, so
 * sending only one field preserves the other (e.g. renaming does not reset type).
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Accounts are not configured." }, { status: 503 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  let body: { accountType?: string; displayName?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const existing = await getProfile(supabase, user.id).catch(() => null);
  const accountType =
    body.accountType === "personal" || body.accountType === "practitioner"
      ? body.accountType
      : (existing?.account_type ?? "personal");
  const displayName =
    typeof body.displayName === "string"
      ? body.displayName.trim() || null
      : (existing?.display_name ?? null);

  try {
    await upsertProfile(supabase, user.id, { accountType, displayName });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not save your profile." },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true, accountType, displayName });
}
