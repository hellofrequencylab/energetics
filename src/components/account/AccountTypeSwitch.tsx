"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Shows the current account type with a one-tap switch to the other. */
export function AccountTypeSwitch({ current }: { current: "personal" | "practitioner" }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const other = current === "personal" ? "practitioner" : "personal";

  async function switchTo() {
    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ accountType: other }),
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-dusk/30 px-4 py-2 text-sm">
      <span className="text-star/70">
        Mode: <span className="font-semibold capitalize text-star">{current}</span>
      </span>
      <button
        type="button"
        onClick={switchTo}
        disabled={loading}
        className="rounded-full bg-horizon-amber px-3 py-1 text-xs font-semibold text-ink transition hover:brightness-110 disabled:opacity-50"
      >
        {loading ? "Switching…" : `Switch to ${other}`}
      </button>
    </div>
  );
}
