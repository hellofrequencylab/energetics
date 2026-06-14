"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, Badge, Button, ButtonLink, EmptyState } from "@/components/ui";

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
      <EmptyState
        className="mt-4"
        title={`No ${noun}s yet`}
        description="Add one to begin building your sky."
        action={<ButtonLink href={addHref} variant="secondary" size="sm">{addLabel}</ButtonLink>}
      />
    );
  }

  return (
    <ul className="mt-4 grid gap-3 sm:grid-cols-2">
      {charts.map((c) => (
        <li key={c.id}>
          <Card className="flex items-center justify-between gap-3 p-4 sm:p-4" interactive>
            <Link href={`/account/chart/${c.id}`} className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate font-medium text-foreground">
                  {c.name || "Unnamed chart"}
                </span>
                {primaryChartId === c.id && <Badge variant="accent">★ My Sky</Badge>}
              </div>
              <div className="mt-0.5 font-mono text-xs text-muted">
                {c.date}
                {c.time ? ` · ${String(c.time).slice(0, 5)}` : ""} · {c.precision}
              </div>
            </Link>
            <div className="flex shrink-0 items-center gap-1.5">
              <ButtonLink href={`/account/chart/${c.id}#edit`} variant="secondary" size="sm">
                Edit
              </ButtonLink>
              <ButtonLink href={`/synastry?a=${c.id}`} variant="secondary" size="sm">
                Compare
              </ButtonLink>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => remove(c.id)}
                disabled={busy === c.id}
                aria-label={`Remove ${c.name || "chart"}`}
              >
                {busy === c.id ? "…" : "Remove"}
              </Button>
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}
