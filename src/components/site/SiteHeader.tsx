import Link from "next/link";
import { getUser } from "@/lib/supabase/server";
import { ConvergenceGraph } from "@/components/marketing/ConvergenceGraph";

const NAV = [
  { href: "/synastry", label: "Resonance" },
  { href: "/glossary", label: "Glossary" },
  { href: "/help", label: "Help" },
  { href: "/about", label: "About" },
];

/**
 * The standardized site header: wordmark, primary navigation, and an auth-aware
 * action. Used across every page so the chrome is consistent. Reads the session
 * server-side, so it must be rendered from a server component.
 */
export async function SiteHeader() {
  const user = await getUser().catch(() => null);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-midnight/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-3">
        <Link href="/welcome" className="flex items-center gap-2" aria-label="OneSky home">
          <ConvergenceGraph animated={false} className="h-6 w-8" label="OneSky" />
          <span className="text-sm font-semibold uppercase tracking-[0.3em] text-star">ONESKY</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-star/75 sm:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="transition hover:text-star">
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3 text-sm">
          {user ? (
            <Link
              href="/account"
              className="rounded-[10px] border border-white/15 px-3 py-1.5 text-star/85 transition hover:border-horizon-amber/40 hover:text-star"
            >
              Account
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-[10px] bg-horizon-amber px-3 py-1.5 font-semibold text-ink [text-shadow:0_1px_0_rgba(255,255,255,0.4)] transition hover:brightness-110"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
