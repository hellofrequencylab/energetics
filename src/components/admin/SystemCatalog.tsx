"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export interface CatalogRow {
  id: string;
  displayName: string;
  lineage: string;
  derivedFrom: string;
  inSynthesis: boolean;
  enabled: boolean;
  group: string;
}

/**
 * The admin systems catalog: one reorderable list. Drag a row by its handle to
 * change the order everyone sees, or use the up/down buttons (keyboard friendly).
 * Each row also has the on/off switch. Order and on/off persist to
 * system_settings via the admin API; the list state is optimistic.
 */
export function SystemCatalog({ systems }: { systems: CatalogRow[] }) {
  const router = useRouter();
  const [items, setItems] = useState<CatalogRow[]>(systems);
  const [overId, setOverId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const dragId = useRef<string | null>(null);

  async function persistOrder(order: string[]) {
    setBusy(true);
    try {
      await fetch("/api/admin/systems/order", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ order }),
      });
    } finally {
      setBusy(false);
    }
  }

  function applyOrder(next: CatalogRow[]) {
    setItems(next);
    void persistOrder(next.map((r) => r.id));
  }

  function moveTo(fromId: string, toId: string) {
    if (fromId === toId) return;
    const arr = [...items];
    const fi = arr.findIndex((r) => r.id === fromId);
    const ti = arr.findIndex((r) => r.id === toId);
    if (fi < 0 || ti < 0) return;
    const [moved] = arr.splice(fi, 1);
    arr.splice(ti, 0, moved);
    applyOrder(arr);
  }

  function nudge(id: string, dir: -1 | 1) {
    const arr = [...items];
    const i = arr.findIndex((r) => r.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    applyOrder(arr);
  }

  async function toggle(id: string, next: boolean) {
    setItems((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: next } : r)));
    try {
      const res = await fetch("/api/admin/systems", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ systemId: id, enabled: next }),
      });
      if (!res.ok) {
        setItems((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: !next } : r)));
      } else {
        router.refresh();
      }
    } catch {
      setItems((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: !next } : r)));
    }
  }

  return (
    <ul className="grid gap-2.5">
      {items.map((r, idx) => (
        <li
          key={r.id}
          draggable
          onDragStart={(e) => {
            dragId.current = r.id;
            e.dataTransfer.effectAllowed = "move";
          }}
          onDragOver={(e) => {
            e.preventDefault();
            if (overId !== r.id) setOverId(r.id);
          }}
          onDragLeave={() => setOverId((cur) => (cur === r.id ? null : cur))}
          onDrop={(e) => {
            e.preventDefault();
            const from = dragId.current;
            dragId.current = null;
            setOverId(null);
            if (from) moveTo(from, r.id);
          }}
          onDragEnd={() => {
            dragId.current = null;
            setOverId(null);
          }}
          className={`flex items-center gap-3 rounded-xl border bg-dusk/20 p-4 transition ${
            overId === r.id ? "border-horizon-amber/70 bg-dusk/40" : "border-white/10"
          }`}
        >
          {/* Drag handle */}
          <span
            aria-hidden
            className="shrink-0 cursor-grab select-none text-star/40 active:cursor-grabbing"
            title="Drag to reorder"
          >
            ⠿
          </span>

          {/* Up / down (keyboard and touch friendly) */}
          <div className="flex shrink-0 flex-col">
            <button
              type="button"
              onClick={() => nudge(r.id, -1)}
              disabled={idx === 0}
              aria-label={`Move ${r.displayName} up`}
              className="px-1 text-star/50 transition hover:text-star disabled:opacity-30"
            >
              ▲
            </button>
            <button
              type="button"
              onClick={() => nudge(r.id, 1)}
              disabled={idx === items.length - 1}
              aria-label={`Move ${r.displayName} down`}
              className="px-1 text-star/50 transition hover:text-star disabled:opacity-30"
            >
              ▼
            </button>
          </div>

          <span className="w-6 shrink-0 text-center font-mono text-xs text-star/40">{idx + 1}</span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate font-medium text-star">{r.displayName}</span>
              <span className="shrink-0 rounded-full border border-white/15 px-2 py-0.5 text-[10px] uppercase tracking-wide text-star/60">
                {r.group}
              </span>
              {!r.inSynthesis && (
                <span className="shrink-0 rounded-full border border-white/15 px-2 py-0.5 text-[10px] uppercase tracking-wide text-star/60">
                  shown, not in synthesis
                </span>
              )}
            </div>
            <div className="mt-0.5 font-mono text-xs text-star/50">
              {r.id} · {r.lineage} · {r.derivedFrom}
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={r.enabled}
            aria-label={`${r.enabled ? "Disable" : "Enable"} ${r.displayName}`}
            disabled={busy}
            onClick={() => toggle(r.id, !r.enabled)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-50 ${
              r.enabled ? "bg-horizon-amber" : "bg-white/15"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-ink transition-all ${
                r.enabled ? "left-[22px]" : "left-0.5"
              }`}
            />
          </button>
        </li>
      ))}
    </ul>
  );
}
