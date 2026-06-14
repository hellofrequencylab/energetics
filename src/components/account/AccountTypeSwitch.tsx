"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

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
    <div className="inline-flex items-center gap-3 rounded-full border border-border bg-surface/40 px-4 py-2 text-sm">
      <span className="text-muted">
        Mode: <span className="font-semibold capitalize text-foreground">{current}</span>
      </span>
      <Button type="button" variant="secondary" size="sm" onClick={switchTo} disabled={loading}>
        {loading ? "Switching…" : `Switch to ${other}`}
      </Button>
    </div>
  );
}
