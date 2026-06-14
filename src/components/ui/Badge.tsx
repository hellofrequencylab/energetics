import type { ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

/**
 * Small status/label pill. `neutral` for plain metadata, `accent` (gold) for a
 * highlighted count or shared theme, `lineage` (violet) for tradition/lineage
 * tags. One pill shape and size across the site.
 */
export type BadgeVariant = "neutral" | "accent" | "lineage";

const VARIANT: Record<BadgeVariant, string> = {
  neutral: "border-border text-muted",
  accent: "border-accent/30 bg-accent/5 text-accent",
  lineage: "border-accent-2/30 bg-accent-2/5 text-accent-2",
};

export function Badge({
  variant = "neutral",
  className,
  children,
}: {
  variant?: BadgeVariant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        VARIANT[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
