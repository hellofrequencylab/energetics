import Link from "next/link";
import { ConvergenceGraph } from "@/components/marketing/ConvergenceGraph";
import { CONTAINER } from "@/components/ui/Container";
import { buttonClasses } from "@/components/ui/Button";
import { cn } from "@/lib/ui/cn";
import { getNavRole } from "./role";
import { headerNav, type NavRole } from "./nav";

/**
 * The one site header, identical on every page (including the splash). The menu is
 * role based (see nav.ts): public product links for everyone, an Admin link for
 * admins, and an action that is Sign in when signed out or Account when signed in.
 * Non-sticky on mobile so it scrolls away, sticky on larger screens. `role` is
 * optional: SiteShell passes it so auth is read once; standalone callers let the
 * header read it.
 */
export async function SiteHeader({ role }: { role?: NavRole } = {}) {
  const r = role ?? (await getNavRole());
  const nav = headerNav(r);

  return (
    <header className="static z-40 border-b border-border bg-midnight/85 backdrop-blur sm:sticky sm:top-0">
      <div className={cn(CONTAINER, "flex items-center justify-between gap-4 py-3")}>
        <Link href="/welcome" className="flex items-center gap-2" aria-label="OneSky home">
          <ConvergenceGraph animated={false} className="h-6 w-8" label="OneSky" />
          <span className="text-sm font-semibold uppercase tracking-[0.3em] text-foreground">ONESKY</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-muted sm:flex">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="transition hover:text-foreground">
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3 text-sm">
          {r.signedIn ? (
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
