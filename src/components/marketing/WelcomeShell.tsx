"use client";

import { useRef, useState, type ReactNode } from "react";
import { BirthForm } from "@/components/BirthForm";
import { Dashboard } from "@/components/marketing/Dashboard";
import type { ComputeResponse } from "@/lib/api-types";

/**
 * Holds the welcome experience together: marketing (the slots), the input app
 * that peeks at the fold and rises to center, and the melt into the reader.
 *
 * The marketing content is server-rendered and passed in as slots, so it keeps
 * its SSR. This client shell owns the interaction: clicking the tab (or
 * scrolling) centers the input; submitting melts the page away and reveals the
 * Dashboard. Reduced motion skips the melt and swaps straight through.
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
  const inputRef = useRef<HTMLDivElement>(null);

  function centerInput() {
    inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

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

      {/* The input app: a tab peeks at the fold, the panel rises to center. */}
      <section id="begin" ref={inputRef} className="relative scroll-mt-[14vh] px-5 pb-28">
        <div className="mx-auto flex max-w-2xl justify-center">
          <button
            type="button"
            onClick={centerInput}
            className="group flex flex-col items-center gap-1.5 rounded-t-2xl border border-b-0 border-white/10 bg-dusk/60 px-10 py-3 backdrop-blur transition hover:bg-dusk"
            aria-label="Begin your reading"
          >
            <span className="h-1 w-10 rounded-full bg-star/30" aria-hidden="true" />
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-horizon-amber">
              Begin your reading
            </span>
            <svg viewBox="0 0 24 12" className="float h-2.5 w-5 text-star/60" aria-hidden="true">
              <path
                d="M2 10 L12 3 L22 10"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <div className="mx-auto max-w-2xl rounded-2xl rounded-t-none border border-white/10 bg-dusk/30 p-6 backdrop-blur sm:p-8">
          <h2 className="font-display text-2xl font-semibold text-star">Enter your birth moment</h2>
          <p className="mt-1 text-sm text-star/60">
            Your date is enough to begin. Add your time and place to unlock more.
          </p>
          <div className="mt-6">
            <BirthForm onResult={handleResult} submitLabel="Reveal my reading" />
          </div>
        </div>
      </section>

      {sections}
      {footer}
    </div>
  );
}
