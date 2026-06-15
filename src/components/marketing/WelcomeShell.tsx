"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { BirthForm } from "@/components/BirthForm";
import { Dashboard } from "@/components/marketing/Dashboard";
import type { ComputeResponse } from "@/lib/api-types";

/** Smooth-scroll the input app to the top of the screen, where it reads as its own step. */
function centerInput() {
  document.getElementById("begin")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/**
 * Holds the welcome experience: marketing (slots), the input app that peeks into
 * the hero, and the melt into the reader.
 *
 * The input snaps to the top when you press a CTA, click the handle, or scroll
 * down from the top. The scroll snap fires once (within a band just below the
 * fold) so it does not hijack in-page anchor navigation. Reduced motion skips the
 * auto-snap. On mobile the welcome header is not sticky (it scrolls away as you
 * reach the form, so the form gets the whole screen). Submitting melts the page
 * away and reveals the Dashboard.
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
  const snapped = useRef(false);

  useEffect(() => {
    if (reading) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    function onScroll() {
      const y = window.scrollY;
      if (y < 6) {
        snapped.current = false;
        return;
      }
      // Only when scrolling down out of the hero, not when jumping to a section.
      if (!snapped.current && y > 24 && y < window.innerHeight * 0.5) {
        snapped.current = true;
        centerInput();
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [reading]);

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
      <main id="main">
      {hero}

      {/* The input app, pulled up so its handle peeks into the hero. On mobile it
          is a full-height step; the header above is not sticky, so it scrolls away
          and the form gets the whole screen. */}
      <section
        id="begin"
        className="relative z-10 -mt-14 scroll-mt-2 px-5 pb-24 sm:scroll-mt-20 max-sm:min-h-[100svh] max-sm:pt-5"
      >
        <div className="mx-auto max-w-3xl">
          <button
            type="button"
            onClick={centerInput}
            aria-label="Begin your reading"
            className="group mx-auto mb-6 flex flex-col items-center gap-1.5"
          >
            <span className="h-1.5 w-12 rounded-full bg-star/30 transition group-hover:bg-star/50" />
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

          <div className="mb-7 text-center">
            <h2 className="font-display text-3xl font-semibold text-star sm:text-4xl">
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
      </main>
      {footer}
    </div>
  );
}
