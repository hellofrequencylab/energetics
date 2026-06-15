"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/ui/cn";

const ICON = "h-5 w-5";
const tabs = [
  {
    href: "/account",
    label: "Charts",
    icon: (
      <svg viewBox="0 0 24 24" className={ICON} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" />
        <line x1="12" y1="4" x2="12" y2="9.5" strokeLinecap="round" />
        <line x1="20" y1="12" x2="14.5" y2="12" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/synastry",
    label: "Resonance",
    icon: (
      <svg viewBox="0 0 24 24" className={ICON} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <circle cx="9" cy="12" r="5.5" />
        <circle cx="15" cy="12" r="5.5" />
      </svg>
    ),
  },
  {
    href: "/glossary",
    label: "Glossary",
    icon: (
      <svg viewBox="0 0 24 24" className={ICON} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M5 5h11a2 2 0 0 1 2 2v12H7a2 2 0 0 1-2-2V5Z" strokeLinejoin="round" />
        <line x1="9" y1="9" x2="14" y2="9" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/help",
    label: "Help",
    icon: (
      <svg viewBox="0 0 24 24" className={ICON} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7" strokeLinecap="round" />
        <circle cx="12" cy="16.5" r="0.6" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
];

/**
 * App-style bottom tab bar for phones, shown for signed-in pages (rendered by
 * SiteShell). Hidden on larger screens, where the header nav serves.
 */
export function MobileTabBar() {
  const pathname = usePathname() ?? "";
  return (
    <nav
      aria-label="App"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-midnight/95 backdrop-blur sm:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around">
        {tabs.map((t) => {
          const active = pathname === t.href || pathname.startsWith(`${t.href}/`);
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 text-[11px] transition",
                  active ? "text-accent" : "text-muted hover:text-foreground",
                )}
              >
                {t.icon}
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
