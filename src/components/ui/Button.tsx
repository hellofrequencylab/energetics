import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/ui/cn";

/**
 * One button language for the whole site.
 *
 * - primary: the single most important action in a view (warm amber fill). Use at
 *   most once per view (see docs/DESIGN.md, "one primary action per view").
 * - secondary: a bordered, lower-emphasis action.
 * - ghost: a quiet text action.
 * - danger: a destructive action (delete), bordered, reddening on hover.
 *
 * `buttonClasses` is exported so a Next.js <Link> can wear the same skin via
 * `ButtonLink`, keeping links and buttons visually identical.
 */
export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-[10px] font-medium transition focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50";

const VARIANT: Record<ButtonVariant, string> = {
  primary:
    "bg-horizon-amber font-semibold text-ink [text-shadow:0_1px_0_rgba(255,255,255,0.4)] hover:brightness-110",
  secondary: "border border-border text-foreground/85 hover:border-accent/50 hover:text-foreground",
  ghost: "text-muted hover:text-foreground",
  danger: "border border-border text-muted hover:border-red-400/40 hover:text-red-300",
};

const SIZE: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

export function buttonClasses(variant: ButtonVariant = "secondary", size: ButtonSize = "md"): string {
  return cn(BASE, VARIANT[variant], SIZE[size]);
}

export function Button({
  variant = "secondary",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <button className={cn(buttonClasses(variant, size), className)} {...props} />;
}

export function ButtonLink({
  href,
  variant = "secondary",
  size = "md",
  className,
  children,
}: {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={cn(buttonClasses(variant, size), className)}>
      {children}
    </Link>
  );
}
