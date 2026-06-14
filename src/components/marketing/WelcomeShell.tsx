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
 * fold) so it does not hijack in-page anchor navigation. Reduced motion skips
 * the auto-snap. Submitting melts the page away and reveals the Dashboard.
 *
 * On mobile, once the form is the focused view, the page chrome (the welcome
 * header and the bottom call-to-action bar, tagged data-welcome-header and
 * data-welcome-cta) is hidden via the `intake-focus` class on <html>, so only the
 * form fills the screen.
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
  const [focused, setFocused] = useState(false);
  const snapped = useRef(false);
  const formRef = useRef<HTMLElement>(null);

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

  // The form is "focused" once it has risen to the top of the screen and still
  // covers most of it. Used to clear the competing chrome on mobile.
  useEffect(() => {
    if (reading) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFocused(false);
      return;
    }
    let raf = 0;
    function measure() {
      raf = 0;
      const el = formRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      setFocused(r.top <= 64 && r.bottom >= vh * 0.45);
    }
    function onScroll() {
      if (!raf) raf = window.requestAnimationFrame(measure);
    }
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [reading]);

  useEffect(() => {
    document.documentElement.classList.toggle("intake-focus", focused);
    return () => document.documentElement.classList.remove("intake-focus");
  }, [focused]);

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

      {/* The input app, pulled up so its handle peeks into the hero. On mobile it
          becomes a focused, full-height panel once it reaches the top. */}
      <section
        ref={formRef}
        id="begin"
        className="relative z-10 -mt-14 scroll-mt-2 px-5 pb-28 sm:scroll-mt-20 max-sm:min-h-[100svh] max-sm:pt-5"
      >
        <div className="mx-auto max-w-3xl">
          <button
            type="button"
            onClick={centerInput}
            aria-label="Begin your reading"
            className={`group mx-auto mb-6 flex flex-col items-center gap-1.5 ${
              focused ? "max-sm:hidden" : ""
            }`}
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

          <div className={`mb-7 text-center ${focused ? "max-sm:hidden" : ""}`}>
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
      {footer}
    </div>
  );
}
