import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/ui/cn";

/**
 * The single, uniform content rail for the whole site. Every page, the header,
 * and the footer align to this one width. To change the site-wide measure, edit
 * this one constant. (Design decision: one uniform container width everywhere;
 * long-form text is constrained with `max-w-prose` inside, not by the rail.)
 */
export const CONTAINER = "mx-auto w-full max-w-5xl px-5 sm:px-6";

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn(CONTAINER, className)}>{children}</div>;
}

/**
 * The standard top-of-page block: an optional back link, an eyebrow, the title,
 * a description, and optional right-aligned actions. Use on every page so the
 * heading rhythm and eyebrow color are identical everywhere.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  back,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <header className="mb-8">
      {back && (
        <Link href={back.href} className="text-sm text-muted transition hover:text-foreground">
          ← {back.label}
        </Link>
      )}
      <div className={cn("flex flex-wrap items-end justify-between gap-x-6 gap-y-4", back && "mt-3")}>
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">{eyebrow}</p>
          )}
          <h1 className="mt-1 font-display text-3xl font-semibold sm:text-4xl">{title}</h1>
          {description && <p className="mt-2 max-w-prose text-muted">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
