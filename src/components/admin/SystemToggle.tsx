"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** One system row in the admin catalog: a switch that persists on/off for all. */
export function SystemToggle({
  systemId,
  displayName,
  lineage,
  derivedFrom,
  inSynthesis,
  enabled,
}: {
  systemId: string;
  displayName: string;
  lineage: string;
  derivedFrom: string;
  inSynthesis: boolean;
  enabled: boolean;
}) {
  const router = useRouter();
  const [on, setOn] = useState(enabled);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    const next = !on;
    setBusy(true);
    setOn(next); // optimistic
    try {
      const res = await fetch("/api/admin/systems", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ systemId, enabled: next }),
      });
      if (!res.ok) {
        setOn(!next); // revert
      } else {
        router.refresh();
      }
    } catch {
      setOn(!next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-dusk/20 p-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium text-star">{displayName}</span>
          {!inSynthesis && (
            <span className="shrink-0 rounded-full border border-white/15 px-2 py-0.5 text-[10px] uppercase tracking-wide text-star/60">
              shown, not in synthesis
            </span>
          )}
        </div>
        <div className="mt-0.5 font-mono text-xs text-star/50">
          {systemId} · {lineage} · {derivedFrom}
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={`${on ? "Disable" : "Enable"} ${displayName}`}
        disabled={busy}
        onClick={toggle}
        className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-50 ${
          on ? "bg-horizon-amber" : "bg-white/15"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-ink transition-all ${
            on ? "left-[22px]" : "left-0.5"
          }`}
        />
      </button>
    </li>
  );
}
