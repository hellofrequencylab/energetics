"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardLabel, Field, Input, Textarea, Button, Divider } from "@/components/ui";

/** Manage one saved chart: rename, notes, My Sky, compare, or delete. */
export function ChartManager({
  id,
  initialName,
  initialNotes,
  practitioner,
  isPrimary,
  primaryChartId,
}: {
  id: string;
  initialName: string;
  initialNotes: string;
  practitioner: boolean;
  isPrimary: boolean;
  primaryChartId: string | null;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [notes, setNotes] = useState(initialNotes);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [deleting, setDeleting] = useState(false);
  const [pinning, setPinning] = useState(false);

  async function togglePrimary() {
    setPinning(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ primaryChartId: isPrimary ? null : id }),
      });
      if (res.ok) router.refresh();
    } finally {
      setPinning(false);
    }
  }

  async function save() {
    setStatus("saving");
    try {
      const res = await fetch(`/api/charts/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(practitioner ? { name, notes } : { name }),
      });
      setStatus(res.ok ? "saved" : "idle");
      if (res.ok) router.refresh();
    } catch {
      setStatus("idle");
    }
  }

  async function remove() {
    if (!window.confirm("Delete this chart? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/charts/${id}`, { method: "DELETE" });
      if (res.ok) router.push("/account");
      else setDeleting(false);
    } catch {
      setDeleting(false);
    }
  }

  return (
    <Card>
      <CardLabel>Manage</CardLabel>

      <Field label="Name" htmlFor="chart-name" className="mt-4">
        <Input
          id="chart-name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setStatus("idle");
          }}
          placeholder="Unnamed chart"
        />
      </Field>

      {practitioner && (
        <Field label="Private notes" htmlFor="chart-notes" className="mt-4">
          <Textarea
            id="chart-notes"
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              setStatus("idle");
            }}
            rows={4}
            placeholder="Notes for your reading, visible only to you."
          />
        </Field>
      )}

      <div className="mt-5 flex items-center gap-3">
        <Button type="button" variant="primary" onClick={save} disabled={status === "saving"}>
          {status === "saving" ? "Saving…" : status === "saved" ? "Saved" : "Save"}
        </Button>
        <Button type="button" variant="danger" onClick={remove} disabled={deleting}>
          {deleting ? "Deleting…" : "Delete chart"}
        </Button>
      </div>

      <Divider className="mt-5" />

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        <button
          type="button"
          onClick={togglePrimary}
          disabled={pinning}
          className={`font-medium transition disabled:opacity-50 ${isPrimary ? "text-accent" : "text-muted hover:text-foreground"}`}
        >
          {isPrimary ? "★ Your sky (unpin)" : "☆ Set as My Sky"}
        </button>
        <Link href={`/synastry?a=${id}`} className="text-muted transition hover:text-foreground">
          Compare
        </Link>
        {primaryChartId && primaryChartId !== id && (
          <Link
            href={`/synastry?a=${id}&b=${primaryChartId}`}
            className="text-muted transition hover:text-foreground"
          >
            Compare with My Sky
          </Link>
        )}
      </div>
    </Card>
  );
}
