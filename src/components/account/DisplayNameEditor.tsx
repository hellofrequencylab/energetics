"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Edit the profile display name. Posts to /api/profile (partial-safe). */
export function DisplayNameEditor({ initial }: { initial: string }) {
  const router = useRouter();
  const [name, setName] = useState(initial);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

  async function save() {
    setStatus("saving");
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ displayName: name }),
      });
      setStatus(res.ok ? "saved" : "idle");
      if (res.ok) router.refresh();
    } catch {
      setStatus("idle");
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-star/70">Display name</span>
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setStatus("idle");
          }}
          placeholder="Your name"
          className="w-56 rounded-lg border border-white/10 bg-background/60 px-3 py-2 text-sm text-star outline-none transition focus:border-horizon-amber"
        />
      </label>
      <button
        type="button"
        onClick={save}
        disabled={status === "saving"}
        className="rounded-lg border border-white/15 px-3 py-2 text-sm text-star/80 transition hover:text-star disabled:opacity-50"
      >
        {status === "saving" ? "Saving…" : status === "saved" ? "Saved" : "Save"}
      </button>
    </div>
  );
}
