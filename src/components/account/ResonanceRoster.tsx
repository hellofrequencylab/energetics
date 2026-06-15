"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, Badge } from "@/components/ui";

export interface ResonanceItem {
  id: string;
  mode: "platonic" | "intimate";
  label: string | null;
  aChartId: string;
  bChartId: string;
  aName: string | null;
  bName: string | null;
}

/** The user's saved resonance comparisons: open one again, or remove it. */
export function ResonanceRoster({ items }: { items: ResonanceItem[] }) {
  const router = useRouter();
  const [removing, setRemoving] = useState<string | null>(null);

  async function remove(id: string) {
    if (!window.confirm("Remove this saved resonance? The charts themselves stay.")) return;
    setRemoving(id);
    try {
      const res = await fetch(`/api/resonances/${id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
      else setRemoving(null);
    } catch {
      setRemoving(null);
    }
  }

  return (
    <ul className="mt-4 grid gap-3 sm:grid-cols-2">
      {items.map((r) => {
        const title = r.label || `${r.aName || "A"} & ${r.bName || "B"}`;
        return (
          <li key={r.id}>
            <Card className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium text-foreground">{title}</span>
                  <Badge variant={r.mode === "intimate" ? "lineage" : "neutral"}>{r.mode}</Badge>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3 text-sm">
                <Link
                  href={`/synastry?a=${r.aChartId}&b=${r.bChartId}&mode=${r.mode}`}
                  className="text-muted transition hover:text-foreground"
                >
                  Open
                </Link>
                <button
                  type="button"
                  onClick={() => remove(r.id)}
                  disabled={removing === r.id}
                  className="text-muted transition hover:text-red-300 disabled:opacity-50"
                >
                  {removing === r.id ? "…" : "Remove"}
                </button>
              </div>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
