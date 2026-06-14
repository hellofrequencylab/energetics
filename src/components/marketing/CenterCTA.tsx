"use client";

import { useRef, type ReactNode } from "react";

/**
 * A call to action that smooth-scrolls the input app (#begin) to the center of
 * the screen. Also leans toward the pointer (magnetic), which is skipped under
 * prefers-reduced-motion. Used for every "see your sky" button on the page.
 */
export function CenterCTA({
  children,
  className = "",
  ariaLabel,
}: {
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  function center() {
    document.getElementById("begin")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function move(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - (r.left + r.width / 2)) * 0.2;
    const y = (e.clientY - (r.top + r.height / 2)) * 0.3;
    el.style.transform = `translate(${x}px, ${y}px)`;
  }

  function reset() {
    if (ref.current) ref.current.style.transform = "";
  }

  return (
    <button
      ref={ref}
      type="button"
      onClick={center}
      onMouseMove={move}
      onMouseLeave={reset}
      aria-label={ariaLabel}
      className={className}
    >
      {children}
    </button>
  );
}
