"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardLabel, Textarea, Button } from "@/components/ui";

/**
 * The chart's notes and record controls, for under the at-a-glance card: a free
 * text notes box (saved to the chart, visible only to you) and the record actions
 * (set as My Sky, compare, delete).
 */
export function ChartRecords({
  id,
  initialNotes,
  isPrimary,
  primaryChartId,
}: {
  id: string;
  initialNotes: string;
  isPrimary: boolean;
  primaryChartId: string | null;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes);
  const [notesStatus, setNotesStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [pinning, setPinning] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function saveNotes() {
    setNotesStatus("saving");
    try {
      const res = await fetch(`/api/charts/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      setNotesStatus(res.ok ? "saved" : "idle");
      if (res.ok) router.refresh();
    } catch {
      setNotesStatus("idle");
    }
  }

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
    <>
      <Card>
        <CardLabel>Notes</CardLabel>
        <Textarea
          className="mt-2"
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            setNotesStatus("idle");
          }}
          rows={4}
          placeholder="Notes on this chart, visible only to you."
        />
        <Button type="button" variant="secondary" size="sm" onClick={saveNotes} disabled={notesStatus === "saving"} className="mt-3">
          {notesStatus === "saving" ? "Saving…" : notesStatus === "saved" ? "Saved" : "Save notes"}
        </Button>
      </Card>

      <Card>
        <CardLabel>Record</CardLabel>
        <div className="mt-3 flex flex-col items-start gap-2 text-sm">
          <button
            type="button"
            onClick={togglePrimary}
            disabled={pinning}
            className={`text-left font-medium transition disabled:opacity-50 ${isPrimary ? "text-accent" : "text-muted hover:text-foreground"}`}
          >
            {isPrimary ? "★ Your sky (unpin)" : "☆ Set as My Sky"}
          </button>
          <Link href={`/synastry?a=${id}`} className="text-muted transition hover:text-foreground">
            Compare
          </Link>
          {primaryChartId && primaryChartId !== id && (
            <Link href={`/synastry?a=${id}&b=${primaryChartId}`} className="text-muted transition hover:text-foreground">
              Compare with My Sky
            </Link>
          )}
          <button
            type="button"
            onClick={remove}
            disabled={deleting}
            className="text-left text-muted transition hover:text-red-300 disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete chart"}
          </button>
        </div>
      </Card>
    </>
  );
}
