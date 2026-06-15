"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/ui/cn";

export interface SectionNavItem {
  href: string;
  label: string;
  /**
   * Also mark the tab active when the path is, or is under, this prefix (defaults
   * to `href`). A plain string, not a function, so the item can be created in a
   * server component and passed across to this client component.
   */
  activePrefix?: string;
}

/**
 * The secondary, role-aware navigation row for the signed-in area (account and
 * admin). Underline tabs that highlight the current section. Items are decided by
 * role at the call site, so the same component serves a reader, a practitioner,
 * and an admin.
 */
export function SectionNav({ items }: { items: SectionNavItem[] }) {
  const pathname = usePathname() ?? "";
  return (
    <nav aria-label="Section" className="flex gap-1 overflow-x-auto">
      {items.map((item) => {
        const base = item.activePrefix ?? item.href;
        const active = pathname === item.href || pathname === base || pathname.startsWith(`${base}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px whitespace-nowrap border-b-2 px-3 py-3 text-sm transition",
              active
                ? "border-accent font-medium text-foreground"
                : "border-transparent text-muted hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
