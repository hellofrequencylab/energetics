"use client";

import Link from "next/link";
import { SynthesisView } from "@/components/SynthesisView";
import { ConvergenceGraph } from "@/components/marketing/ConvergenceGraph";
import type { ComputeResponse } from "@/lib/api-types";

/**
 * The reader / account area. After someone enters their birth moment and the
 * welcome page melts away, they land here: their chart and synthesis (the
 * reader), with options for resonance charts and the rest of the app.
 *
 * Per the gating decision, the basics show to everyone and signing in unlocks
 * the full set and saving. The full SynthesisView renders here today; the
 * metric-level gate is a later refinement.
 */
export function Dashboard({
  data,
  intakeBody,
  onReset,
}: {
  data: ComputeResponse;
  intakeBody: unknown;
  onReset: () => void;
}) {
  const name = (intakeBody as { name?: string } | null)?.name?.trim();

  const options = [
    {
      title: "Resonance: platonic",
      body: "Compare two charts as friends, family, or collaborators. Shared ground and complementary tension.",
      href: "/synastry?mode=platonic",
    },
    {
      title: "Resonance: intimate",
      body: "Compare two charts as partners. Where you meet, where you stretch each other.",
      href: "/synastry?mode=intimate",
    },
    {
      title: "Today",
      body: "The current sky read against your chart. Daily and seasonal movement.",
      href: "#today",
    },
    {
      title: "Glossary",
      body: "Look up any sign, planet, number, day sign, tone, or card.",
      href: "/glossary",
    },
  ];

  return (
    <div className="min-h-screen bg-midnight text-star">
      {/* Account bar */}
      <header className="sticky top-0 z-30 border-b border-white/5 bg-midnight/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-3">
          <Link href="/welcome" className="flex items-center gap-2" aria-label="OneSky home">
            <ConvergenceGraph animated={false} className="h-6 w-8" label="OneSky" />
            <span className="text-sm font-semibold uppercase tracking-[0.3em]">ONESKY</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <button
              type="button"
              onClick={onReset}
              className="rounded-[10px] border border-white/15 px-3 py-1.5 text-star/80 transition hover:text-star"
            >
              New reading
            </button>
            <Link
              href="/login?next=/account"
              className="rounded-[10px] bg-horizon-amber px-3 py-1.5 font-semibold text-ink transition hover:brightness-110"
            >
              Sign in to save
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-5 py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-horizon-amber">Your reading</p>
        <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
          {name ? `${name}, here is your sky` : "Here is your sky"}
        </h1>
        <p className="mt-2 max-w-xl text-star/70">
          Every tradition read your birth moment on its own. Below, see each one and where they
          converge. Sign in to save this and unlock the full set.
        </p>

        {/* Options */}
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {options.map((o) => (
            <Link
              key={o.title}
              href={o.href}
              className="group rounded-[14px] border border-white/10 bg-dusk/30 p-4 transition duration-[200ms] hover:-translate-y-0.5 hover:border-horizon-amber/40"
            >
              <div className="font-display text-lg font-semibold">{o.title}</div>
              <p className="mt-1 text-sm text-star/65">{o.body}</p>
            </Link>
          ))}
        </div>

        {/* The reader */}
        <div className="mt-10 rounded-2xl border border-white/10 bg-background/60 p-5 sm:p-6">
          <SynthesisView data={data} intakeBody={intakeBody} />
        </div>
      </main>
    </div>
  );
}
