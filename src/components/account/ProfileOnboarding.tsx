"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Type = "personal" | "practitioner";

/** First-run choice between a Personal and a Practitioner profile. Switchable later. */
export function ProfileOnboarding() {
  const router = useRouter();
  const [loading, setLoading] = useState<Type | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function choose(accountType: Type) {
    setError(null);
    setLoading(accountType);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ accountType }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Could not save your choice.");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setLoading(null);
    }
  }

  const card =
    "flex h-full flex-col rounded-2xl border border-white/10 bg-dusk/25 p-6 text-left transition duration-[200ms] hover:-translate-y-0.5 hover:border-horizon-amber/40 hover:bg-dusk/40 disabled:opacity-50";

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-horizon-amber">Welcome</p>
      <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">How will you use OneSky?</h1>
      <p className="mt-2 text-star/70">You can change this anytime in your account.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <button type="button" onClick={() => choose("personal")} disabled={loading !== null} className={card}>
          <h2 className="font-display text-xl font-semibold">Personal</h2>
          <p className="mt-2 flex-1 text-sm text-star/70">
            Your own charts and your connections with the people in your life.
          </p>
          <span className="mt-4 text-sm font-semibold text-horizon-amber">
            {loading === "personal" ? "Setting up…" : "Choose personal"}
          </span>
        </button>

        <button type="button" onClick={() => choose("practitioner")} disabled={loading !== null} className={card}>
          <h2 className="font-display text-xl font-semibold">Practitioner</h2>
          <p className="mt-2 flex-1 text-sm text-star/70">
            Keep a roster of the charts you read for others, each with private notes.
          </p>
          <span className="mt-4 text-sm font-semibold text-horizon-amber">
            {loading === "practitioner" ? "Setting up…" : "Choose practitioner"}
          </span>
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
    </div>
  );
}
