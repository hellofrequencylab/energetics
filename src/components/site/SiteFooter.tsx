import Link from "next/link";
import { ConvergenceGraph } from "@/components/marketing/ConvergenceGraph";
import { CONTAINER } from "@/components/ui/Container";
import { cn } from "@/lib/ui/cn";
import { getNavRole } from "./role";
import { accountNav, type NavItem, type NavRole } from "./nav";

const LINK = "text-muted transition hover:text-foreground";

const EXPLORE: NavItem[] = [
  { href: "/welcome", label: "Read your sky" },
  { href: "/synastry", label: "Resonance" },
  { href: "/glossary", label: "Glossary" },
];
const LEARN: NavItem[] = [
  { href: "/help", label: "Help center" },
  { href: "/about", label: "About the systems" },
  { href: "/help#whats-new", label: "What's new" },
];

function FooterColumn({ title, links }: { title: string; links: NavItem[] }) {
  return (
    <nav aria-label={title}>
      <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{title}</h2>
      <ul className="mt-3 space-y-2 text-sm">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className={LINK}>
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * The one site footer, identical on every page. Its account column is role based
 * (see nav.ts): Sign in when signed out, or Your charts, Admin (admins), and Sign
 * out when signed in. `role` is optional: SiteShell passes it so auth is read once.
 */
export async function SiteFooter({ role }: { role?: NavRole } = {}) {
  const r = role ?? (await getNavRole());
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-border bg-midnight/60">
      <div className={cn(CONTAINER, "py-12")}>
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-w-xs">
            <Link href="/welcome" className="flex items-center gap-2" aria-label="OneSky home">
              <ConvergenceGraph animated={false} className="h-6 w-8" label="OneSky" />
              <span className="text-sm font-semibold uppercase tracking-[0.3em] text-foreground">ONESKY</span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Many traditions, one sky. Your birth moment read across systems, with the overlap shown
              honestly and never blended into a single score.
            </p>
          </div>

          <FooterColumn title="Explore" links={EXPLORE} />
          <FooterColumn title="Learn" links={LEARN} />

          <nav aria-label="Your account">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Your account</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {accountNav(r).map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={LINK}>
                    {l.label}
                  </Link>
                </li>
              ))}
              {r.signedIn && (
                <li>
                  <form action="/auth/signout" method="post">
                    <button type="submit" className={cn(LINK, "text-left")}>
                      Sign out
                    </button>
                  </form>
                </li>
              )}
            </ul>
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-border pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            Your birth data is yours. You can read a full chart without an account, and delete saved
            charts anytime.
          </p>
          <div className="flex items-center gap-5">
            <a href="mailto:hello@onesky.app" className="transition hover:text-foreground">
              Contact
            </a>
            <span>© {year} OneSky</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
