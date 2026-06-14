"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BirthForm } from "@/components/BirthForm";
import { Card, Button } from "@/components/ui";

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
    <Card>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold">Add a {noun}</h2>
          <p className="mt-1 text-sm text-muted">Compute a chart and save it to your roster.</p>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => setOpen((o) => !o)}
          className="shrink-0"
        >
          {open ? "Close" : `New ${noun}`}
        </Button>
      </div>

      {added && (
        <p className="mt-3 rounded-lg border border-accent/30 bg-accent/5 px-3 py-2 text-sm text-accent">
          Saved {added} to your roster.
        </p>
      )}

      {open && (
        <div className="mt-5">
          <BirthForm onResult={handleResult} submitLabel={submitLabel} />
        </div>
      )}
    </Card>
  );
}
