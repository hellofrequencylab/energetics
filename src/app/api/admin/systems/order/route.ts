import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin, setSystemOrder } from "@/lib/db/queries";
import { CATALOG } from "@/lib/core/catalog";

export const runtime = "nodejs";

/**
 * POST /api/admin/systems/order
 * Body: { order: string[] }. Persist the catalog display order. Admin only:
 * checked here AND enforced by row level security on system_settings.
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

  let body: { order?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!Array.isArray(body.order) || !body.order.every((id) => typeof id === "string")) {
    return NextResponse.json({ error: "order must be an array of system ids." }, { status: 422 });
  }
  // Keep only known systems, preserving the submitted order.
  const ids = (body.order as string[]).filter((id) => id in CATALOG);

  try {
    await setSystemOrder(supabase, ids);
  } catch (err) {
    console.error("admin systems order POST failed", err);
    return NextResponse.json({ error: "Could not save the order." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
