/**
 * Cache-backed chart load (performance only — never changes output).
 *
 * When a chart was already computed and persisted at the CURRENT ephemeris and
 * corpus versions, rebuild the computed systems from the stored native results,
 * re-running only the pure, cheap adapters instead of every engine. Strict
 * all-or-nothing: any missing system, version mismatch, or adapter error returns
 * null, and the caller computes fresh. The output is identical to `computeChart`
 * because adapters are deterministic functions of the native result.
 */
import type { Precision } from "@/lib/core/birth-event";
import type { NativeResult, SystemMeta } from "@/lib/core/contracts";
import { allMeta, enginesFor, getSystem } from "@/lib/core/registry";
import { requirementReason, type ChartComputation } from "@/lib/compute";
import type { ComputedSystem } from "@/lib/synthesis/types";
import type { DbClient } from "@/lib/db/queries";

export async function loadCachedChart(
  supabase: DbClient,
  birthEventId: string,
  precision: Precision,
  only: ReadonlySet<string>,
  ephemerisVersion: string,
): Promise<ChartComputation | null> {
  const satisfiable = new Set(enginesFor(precision).map((m) => m.id));
  const wanted = allMeta().filter((m) => only.has(m.id) && satisfiable.has(m.id));
  if (wanted.length === 0) return null;

  const { data, error } = await supabase
    .from("chart_computations")
    .select("system_id, corpus_version, native")
    .eq("birth_event_id", birthEventId)
    .eq("ephemeris_version", ephemerisVersion);
  if (error || !data) return null;

  const byId = new Map(
    (data as { system_id: string; corpus_version: string; native: unknown }[]).map((r) => [r.system_id, r]),
  );

  const computations: ComputedSystem[] = [];
  for (const meta of wanted) {
    const row = byId.get(meta.id);
    // Any miss or version mismatch falls back to a full recompute.
    if (!row || row.corpus_version !== meta.corpusVersion) return null;
    const system = getSystem(meta.id);
    if (!system) return null;
    try {
      const native = row.native as NativeResult;
      computations.push({ meta, native, primitives: system.adapter.toPrimitives(native) });
    } catch {
      return null;
    }
  }

  // Same as computeChart: enabled systems not satisfiable at this precision.
  const unavailable: { meta: SystemMeta; reason: string }[] = allMeta()
    .filter((m) => only.has(m.id) && !satisfiable.has(m.id))
    .map((m) => ({ meta: m, reason: requirementReason(m) }));

  return { computations, unavailable, ephemerisVersion };
}
