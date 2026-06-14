"use client";

import { useState, type ReactNode } from "react";
import { BirthForm } from "@/components/BirthForm";
import { Dashboard } from "@/components/marketing/Dashboard";
import type { ComputeResponse } from "@/lib/api-types";

/**
 * Holds the welcome experience together: marketing (the slots), the input app
 * (which settles to center via scroll snap, or by any CTA), and the melt into
 * the reader.
 *
 * The marketing content is server-rendered and passed in as slots, so it keeps
 * its SSR. This client shell owns the melt: submitting the form melts the page
 * away and reveals the Dashboard. Reduced motion skips the melt and swaps
 * straight through.
 */
export function WelcomeShell({
  hero,
  sections,
  footer,
}: {
  hero: ReactNode;
  sections: ReactNode;
  footer: ReactNode;
}) {
  const [reading, setReading] = useState<{ data: ComputeResponse; intake: unknown } | null>(null);
  const [melting, setMelting] = useState(false);

  function handleResult(data: ComputeResponse, intake: unknown) {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setReading({ data, intake });
      window.scrollTo({ top: 0 });
      return;
    }
    setMelting(true);
    window.setTimeout(() => {
      setReading({ data, intake });
      window.scrollTo({ top: 0 });
    }, 750);
  }

  if (reading) {
    return (
      <Dashboard
        data={reading.data}
        intakeBody={reading.intake}
        onReset={() => {
          setReading(null);
          setMelting(false);
        }}
      />
    );
  }

  return (
    <div
      className={`transition duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        melting ? "pointer-events-none scale-[0.98] opacity-0 blur-lg" : ""
      }`}
    >
      {hero}

      {/* The input app. Settles to center on scroll (snap) or any CTA. */}
      <section id="begin" className="snap-center scroll-mt-[10vh] px-5 py-20 sm:py-28">
        <div className="mx-auto max-w-xl">
          <div className="mb-7 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-horizon-amber">
              Your reading
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-star sm:text-4xl">
              Enter your birth moment
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-star/60">
              Your date is enough to begin. Add your time and place to unlock more.
            </p>
          </div>
          <BirthForm onResult={handleResult} submitLabel="Reveal my reading" />
        </div>
      </section>

      {sections}
      {footer}
    </div>
  );
}
