/**
 * Effective system settings: the catalog defaults overlaid with an admin's live
 * on/off toggles from `energetics.system_settings`. Server-only (reads the DB).
 * Falls back to catalog defaults when Supabase is not configured or unreachable,
 * so the offered set is always well-defined.
 *
 * `inSynthesis` is NOT overlaid here: it is a fixed design rule in the catalog,
 * so the synthesis can stay a pure function (see lib/synthesis/index.ts).
 */
import { createClient } from "@/lib/supabase/server";
import { CATALOG, defaultEnabledIds } from "./catalog";

/** The live enabled set: catalog defaults with any admin overrides applied. */
export async function effectiveEnabledIds(): Promise<Set<string>> {
  const enabled = defaultEnabledIds();
  try {
    const supabase = await createClient();
    if (!supabase) return enabled;
    const { data } = await supabase.from("system_settings").select("system_id, enabled");
    for (const row of (data ?? []) as { system_id: string; enabled: boolean }[]) {
      if (!(row.system_id in CATALOG)) continue;
      if (row.enabled) enabled.add(row.system_id);
      else enabled.delete(row.system_id);
    }
  } catch {
    // Best effort: fall back to the catalog defaults.
  }
  return enabled;
}

/** Per-system enabled state for the admin UI: catalog default plus any override. */
export async function effectiveEnabledMap(): Promise<Map<string, boolean>> {
  const defaults = defaultEnabledIds();
  const map = new Map<string, boolean>(Object.keys(CATALOG).map((id) => [id, defaults.has(id)]));
  try {
    const supabase = await createClient();
    if (supabase) {
      const { data } = await supabase.from("system_settings").select("system_id, enabled");
      for (const row of (data ?? []) as { system_id: string; enabled: boolean }[]) {
        if (row.system_id in CATALOG) map.set(row.system_id, !!row.enabled);
      }
    }
  } catch {
    // Best effort.
  }
  return map;
}
