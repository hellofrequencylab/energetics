"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, Card } from "@/components/ui";

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

  return (
    <div>
      <PageHeader
        eyebrow="Welcome"
        title="How will you use OneSky?"
        description="You can change this anytime in your account."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => choose("personal")}
          disabled={loading !== null}
          className="h-full text-left disabled:opacity-50"
        >
          <Card interactive className="flex h-full flex-col">
            <h2 className="font-display text-xl font-semibold">Personal</h2>
            <p className="mt-2 flex-1 text-sm text-muted">
              Your own charts and your connections with the people in your life.
            </p>
            <span className="mt-4 text-sm font-semibold text-accent">
              {loading === "personal" ? "Setting up…" : "Choose personal"}
            </span>
          </Card>
        </button>

        <button
          type="button"
          onClick={() => choose("practitioner")}
          disabled={loading !== null}
          className="h-full text-left disabled:opacity-50"
        >
          <Card interactive className="flex h-full flex-col">
            <h2 className="font-display text-xl font-semibold">Practitioner</h2>
            <p className="mt-2 flex-1 text-sm text-muted">
              Keep a roster of the charts you read for others, each with private notes.
            </p>
            <span className="mt-4 text-sm font-semibold text-accent">
              {loading === "practitioner" ? "Setting up…" : "Choose practitioner"}
            </span>
          </Card>
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
    </div>
  );
}
