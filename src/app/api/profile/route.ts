import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { upsertProfile } from "@/lib/db/queries";

export const runtime = "nodejs";

/** POST /api/profile: set the signed-in user's account type (personal or practitioner). */
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

  const accountType = body.accountType === "practitioner" ? "practitioner" : "personal";
  try {
    await upsertProfile(supabase, user.id, { accountType, displayName: body.displayName });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not save your profile." },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true, accountType });
}
