import { describe, it, expect } from "vitest";
import { intake } from "@/lib/core/birth-event";
import { computeChart } from "@/lib/compute";
import { synthesize } from "@/lib/synthesis";
import { loadCachedChart } from "@/lib/compute-cache";
import type { DbClient } from "@/lib/db/queries";

const { event } = intake({
  name: "Albert Einstein",
  date: "1879-03-14",
  time: "11:30",
  place: { lat: 48.4011, lng: 9.9876, tz: "Europe/Berlin" },
});
const real = computeChart(event);
const only = new Set(real.computations.map((c) => c.meta.id));

// Mirror the DB round-trip: native is stored as jsonb, so adapters must rebuild
// from plain JSON, not the engine's in-memory object.
type Row = { system_id: string; corpus_version: string; native: unknown };
const rows: Row[] = real.computations.map((c) => ({
  system_id: c.meta.id,
  corpus_version: c.meta.corpusVersion,
  native: JSON.parse(JSON.stringify(c.native)),
}));

function fakeClient(data: Row[] | null, error = false): DbClient {
  const result = { data: error ? null : data, error: error ? { message: "boom" } : null };
  const builder: Record<string, unknown> = {};
  builder.select = () => builder;
  builder.eq = () => builder;
  builder.then = (resolve: (v: typeof result) => unknown) => Promise.resolve(result).then(resolve);
  return { from: () => builder } as unknown as DbClient;
}

describe("loadCachedChart", () => {
  it("rebuilds identical computations and synthesis from cached native", async () => {
    const cached = await loadCachedChart(fakeClient(rows), event.id, event.precision, only, real.ephemerisVersion);
    expect(cached).not.toBeNull();
    expect(cached!.computations.map((c) => c.meta.id).sort()).toEqual(
      real.computations.map((c) => c.meta.id).sort(),
    );
    // Adapters are deterministic functions of native, so synthesis is identical.
    expect(synthesize(event.id, cached!.computations)).toEqual(synthesize(event.id, real.computations));
  });

  it("returns null when any wanted system is missing (all-or-nothing)", async () => {
    const cached = await loadCachedChart(fakeClient(rows.slice(0, -1)), event.id, event.precision, only, real.ephemerisVersion);
    expect(cached).toBeNull();
  });

  it("returns null on a corpus-version mismatch (stale cache)", async () => {
    const stale = rows.map((r, i) => (i === 0 ? { ...r, corpus_version: "stale" } : r));
    const cached = await loadCachedChart(fakeClient(stale), event.id, event.precision, only, real.ephemerisVersion);
    expect(cached).toBeNull();
  });

  it("returns null on a query error", async () => {
    const cached = await loadCachedChart(fakeClient(null, true), event.id, event.precision, only, real.ephemerisVersion);
    expect(cached).toBeNull();
  });
});
