"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

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

  const input =
    "w-full rounded-lg border border-white/10 bg-background/60 px-3 py-2 text-sm text-star outline-none transition focus:border-horizon-amber";

  return (
    <div className="rounded-xl border border-white/10 bg-dusk/20 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-horizon-amber">Manage</p>

      <label className="mt-4 flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-star/70">Name</span>
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setStatus("idle");
          }}
          placeholder="Unnamed chart"
          className={input}
        />
      </label>

      {practitioner && (
        <label className="mt-4 flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-star/70">
            Private notes
          </span>
          <textarea
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              setStatus("idle");
            }}
            rows={4}
            placeholder="Notes for your reading, visible only to you."
            className={`${input} resize-y`}
          />
        </label>
      )}

      <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={status === "saving"}
          className="rounded-lg bg-horizon-amber px-4 py-2 text-sm font-semibold text-ink transition hover:brightness-110 disabled:opacity-50"
        >
          {status === "saving" ? "Saving…" : status === "saved" ? "Saved" : "Save"}
        </button>
        <button
          type="button"
          onClick={remove}
          disabled={deleting}
          className="rounded-lg border border-white/10 px-4 py-2 text-sm text-star/70 transition hover:border-red-400/40 hover:text-red-300 disabled:opacity-50"
        >
          {deleting ? "Deleting…" : "Delete chart"}
        </button>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/10 pt-5 text-sm">
        <button
          type="button"
          onClick={togglePrimary}
          disabled={pinning}
          className={`font-medium transition disabled:opacity-50 ${isPrimary ? "text-horizon-amber" : "text-star/70 hover:text-star"}`}
        >
          {isPrimary ? "★ Your sky (unpin)" : "☆ Set as My Sky"}
        </button>
        <Link href={`/synastry?a=${id}`} className="text-star/70 transition hover:text-star">
          Compare
        </Link>
        {primaryChartId && primaryChartId !== id && (
          <Link
            href={`/synastry?a=${id}&b=${primaryChartId}`}
            className="text-star/70 transition hover:text-star"
          >
            Compare with My Sky
          </Link>
        )}
      </div>
    </div>
  );
}
