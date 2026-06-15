import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin, setSystemEnabled } from "@/lib/db/queries";
import { CATALOG } from "@/lib/core/catalog";

export const runtime = "nodejs";

/**
 * POST /api/admin/systems
 * Body: { systemId, enabled }. Switch a system on or off for everyone. Admin
 * only: checked here AND enforced by row level security on system_settings.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Not configured." }, { status: 503 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  if (!(await isAdmin(supabase, user.id))) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  let body: { systemId?: unknown; enabled?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const systemId = typeof body.systemId === "string" ? body.systemId : "";
  if (!(systemId in CATALOG)) {
    return NextResponse.json({ error: "Unknown system." }, { status: 422 });
  }
  if (typeof body.enabled !== "boolean") {
    return NextResponse.json({ error: "enabled must be a boolean." }, { status: 422 });
  }

  try {
    await setSystemEnabled(supabase, systemId, body.enabled);
  } catch (err) {
    console.error("admin systems POST failed", err);
    return NextResponse.json({ error: "Could not save." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
