import type { ReactNode } from "react";
import { cn } from "@/lib/ui/cn";
import { SandMark } from "./SandMark";

/**
 * The one empty/zero state: the sand mark, a title, a line of guidance, and an
 * optional action. Use wherever a list or panel has nothing to show yet, instead
 * of a bare line of muted text.
 */
export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-2xl border border-dashed border-border bg-surface/30 px-6 py-12 text-center",
        className,
      )}
    >
      <SandMark className="h-14 w-20 opacity-80" />
      <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
