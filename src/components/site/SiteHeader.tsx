import Link from "next/link";
import { getUser } from "@/lib/supabase/server";
import { ConvergenceGraph } from "@/components/marketing/ConvergenceGraph";
import { CONTAINER } from "@/components/ui/Container";
import { buttonClasses } from "@/components/ui/Button";
import { cn } from "@/lib/ui/cn";

const NAV = [
  { href: "/synastry", label: "Resonance" },
  { href: "/glossary", label: "Glossary" },
  { href: "/help", label: "Help" },
  { href: "/about", label: "About" },
];

/**
 * The standardized site header: wordmark, primary navigation, and an auth-aware
 * action, on the one uniform site width. Used across every page so the chrome is
 * consistent. Reads the session server-side, so it must render from a server
 * component. Role-specific destinations (account, admin) live in the section
 * sub-nav (AppSectionNav), shown on signed-in pages.
 */
export async function SiteHeader() {
  const user = await getUser().catch(() => null);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-midnight/85 backdrop-blur">
      <div className={cn(CONTAINER, "flex items-center justify-between gap-4 py-3")}>
        <Link href="/welcome" className="flex items-center gap-2" aria-label="OneSky home">
          <ConvergenceGraph animated={false} className="h-6 w-8" label="OneSky" />
          <span className="text-sm font-semibold uppercase tracking-[0.3em] text-foreground">ONESKY</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-muted sm:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="transition hover:text-foreground">
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3 text-sm">
          {user ? (
            <Link href="/account" className={buttonClasses("secondary", "sm")}>
              Account
            </Link>
          ) : (
            <Link href="/login" className={buttonClasses("primary", "sm")}>
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
