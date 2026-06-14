"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BirthForm } from "@/components/BirthForm";

/**
 * Add a new chart from the account. Reuses the birth form; computing while
 * signed in saves the chart to the roster, so on success we refresh the list.
 */
export function AddChartPanel({ noun, submitLabel }: { noun: string; submitLabel: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [added, setAdded] = useState<string | null>(null);

  function handleResult(_data: unknown, intake: unknown) {
    const name = (intake as { name?: string } | null)?.name?.trim();
    setAdded(name || "New chart");
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-dusk/20 p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold">Add a {noun}</h2>
          <p className="mt-1 text-sm text-star/70">Compute a chart and save it to your roster.</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="shrink-0 rounded-lg bg-horizon-amber px-4 py-2 text-sm font-semibold text-ink [text-shadow:0_1px_0_rgba(255,255,255,0.5)] transition hover:brightness-110"
        >
          {open ? "Close" : `New ${noun}`}
        </button>
      </div>

      {added && (
        <p className="mt-3 rounded-lg border border-horizon-amber/30 bg-horizon-amber/10 px-3 py-2 text-sm text-horizon-amber">
          Saved {added} to your roster.
        </p>
      )}

      {open && (
        <div className="mt-5">
          <BirthForm onResult={handleResult} submitLabel={submitLabel} />
        </div>
      )}
    </div>
  );
}
