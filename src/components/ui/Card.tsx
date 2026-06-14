import type { ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

/**
 * The one card surface. `default` is the neutral panel; `accent` tints it gold for
 * a highlighted/convergence context; `interactive` adds the hover lift used for
 * clickable cards (links). Padding and radius are fixed here so cards never drift.
 */
export type CardVariant = "default" | "accent";

export function Card({
  variant = "default",
  interactive = false,
  className,
  children,
}: {
  variant?: CardVariant;
  interactive?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-5 sm:p-6",
        variant === "accent" ? "border-accent/30 bg-accent/5" : "border-border bg-surface/40",
        interactive &&
          "transition duration-[200ms] hover:-translate-y-0.5 hover:border-accent/40 hover:bg-surface/60",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** A small uppercase label used at the top of a card or section. */
export function CardLabel({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <p className={cn("text-xs font-semibold uppercase tracking-wide text-accent", className)}>
      {children}
    </p>
  );
}
