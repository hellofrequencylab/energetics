/**
 * Effective system settings: the catalog defaults overlaid with an admin's live
 * on/off toggles and display order from `onesky.system_settings`. Server-only
 * (reads the DB). Falls back to catalog defaults when Supabase is not configured
 * or unreachable, so the offered set and order are always well-defined.
 *
 * A row's `enabled` is an override: true/false changes the default, null means
 * "inherit the catalog default" (a row may exist only to carry `sort_order`).
 * `inSynthesis` is NOT overlaid here: it is a fixed design rule in the catalog,
 * so the synthesis can stay a pure function (see lib/synthesis/index.ts).
 */
import { createClient } from "@/lib/supabase/server";
import { CATALOG, defaultEnabledIds } from "./catalog";

interface SettingRow {
  system_id: string;
  enabled: boolean | null;
  sort_order: number | null;
}

async function readSettings(): Promise<SettingRow[]> {
  try {
    const supabase = await createClient();
    if (!supabase) return [];
    const { data } = await supabase.from("system_settings").select("system_id, enabled, sort_order");
    return (data ?? []) as SettingRow[];
  } catch {
    return [];
  }
}

/** The live enabled set: catalog defaults with any admin overrides applied. */
export async function effectiveEnabledIds(): Promise<Set<string>> {
  const enabled = defaultEnabledIds();
  for (const row of await readSettings()) {
    if (!(row.system_id in CATALOG) || row.enabled == null) continue;
    if (row.enabled) enabled.add(row.system_id);
    else enabled.delete(row.system_id);
  }
  return enabled;
}

/** Per-system enabled state for the admin UI: catalog default plus any override. */
export async function effectiveEnabledMap(): Promise<Map<string, boolean>> {
  const defaults = defaultEnabledIds();
  const map = new Map<string, boolean>(Object.keys(CATALOG).map((id) => [id, defaults.has(id)]));
  for (const row of await readSettings()) {
    if (row.system_id in CATALOG && row.enabled != null) map.set(row.system_id, !!row.enabled);
  }
  return map;
}

/** The admin-set display order: system id to its sort position, when set. */
export async function effectiveOrderMap(): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  for (const row of await readSettings()) {
    if (row.system_id in CATALOG && row.sort_order != null) map.set(row.system_id, row.sort_order);
  }
  return map;
}

/**
 * Sort a list by the admin order. Items with a saved order come first in that
 * order; the rest keep their original (registry) order, after the ordered ones.
 * Pure: safe to call once an order map is in hand.
 */
export function sortByOrder<T>(list: T[], getId: (item: T) => string, order: Map<string, number>): T[] {
  return list
    .map((item, i) => ({ item, key: order.get(getId(item)) ?? 1000 + i }))
    .sort((a, b) => a.key - b.key)
    .map((x) => x.item);
}
