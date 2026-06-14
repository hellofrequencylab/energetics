"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export interface RosterChart {
  id: string;
  name: string | null;
  date: string;
  time: string | null;
  precision: string;
}

/** The saved-chart roster with inline management (open, delete). */
export function ChartRoster({
  charts,
  addHref,
  addLabel,
  noun,
  primaryChartId,
}: {
  charts: RosterChart[];
  addHref: string;
  addLabel: string;
  noun: string;
  primaryChartId?: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function remove(id: string) {
    if (!window.confirm(`Remove this ${noun}? This cannot be undone.`)) return;
    setBusy(id);
    try {
      const res = await fetch(`/api/charts/${id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setBusy(null);
    }
  }

  if (charts.length === 0) {
    return (
      <p className="mt-4 rounded-xl border border-white/10 bg-dusk/20 p-6 text-sm text-star/70">
        No {noun}s yet.{" "}
        <Link className="font-medium text-horizon-amber underline underline-offset-4" href={addHref}>
          {addLabel}
        </Link>{" "}
        to begin.
      </p>
    );
  }

  return (
    <ul className="mt-4 grid gap-3 sm:grid-cols-2">
      {charts.map((c) => (
        <li
          key={c.id}
          className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-dusk/20 p-4 transition hover:border-horizon-amber/40 hover:bg-dusk/35"
        >
          <Link href={`/account/chart/${c.id}`} className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate font-medium text-star">{c.name || "Unnamed chart"}</span>
              {primaryChartId === c.id && (
                <span className="shrink-0 text-xs text-horizon-amber">★ My Sky</span>
              )}
            </div>
            <div className="mt-0.5 font-mono text-xs text-star/60">
              {c.date}
              {c.time ? ` · ${String(c.time).slice(0, 5)}` : ""} · {c.precision}
            </div>
          </Link>
          <div className="flex shrink-0 items-center gap-1.5">
            <Link
              href={`/account/chart/${c.id}#edit`}
              className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-star/70 transition hover:border-horizon-amber/40 hover:text-star"
            >
              Edit
            </Link>
            <Link
              href={`/synastry?a=${c.id}`}
              className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-star/70 transition hover:border-horizon-amber/40 hover:text-star"
            >
              Compare
            </Link>
            <button
              type="button"
              onClick={() => remove(c.id)}
              disabled={busy === c.id}
              aria-label={`Remove ${c.name || "chart"}`}
              className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-star/60 transition hover:border-red-400/40 hover:text-red-300 disabled:opacity-50"
            >
              {busy === c.id ? "…" : "Remove"}
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
