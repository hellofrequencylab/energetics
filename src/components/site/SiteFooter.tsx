import Link from "next/link";
import { ConvergenceGraph } from "@/components/marketing/ConvergenceGraph";

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Explore",
    links: [
      { href: "/welcome", label: "Read your sky" },
      { href: "/synastry", label: "Resonance" },
      { href: "/glossary", label: "Glossary" },
    ],
  },
  {
    title: "Learn",
    links: [
      { href: "/help", label: "Help center" },
      { href: "/about", label: "About the systems" },
      { href: "/help#whats-new", label: "What's new" },
    ],
  },
  {
    title: "Your account",
    links: [
      { href: "/account", label: "Your charts" },
      { href: "/login", label: "Sign in" },
    ],
  },
];

/** The standardized, comprehensive site footer. Presentational and shared. */
export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-white/10 bg-midnight/60">
      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-w-xs">
            <Link href="/welcome" className="flex items-center gap-2" aria-label="OneSky home">
              <ConvergenceGraph animated={false} className="h-6 w-8" label="OneSky" />
              <span className="text-sm font-semibold uppercase tracking-[0.3em] text-star">ONESKY</span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-star/70">
              Many traditions, one sky. Your birth moment read across systems, with the overlap shown
              honestly and never blended into a single score.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-star/55">{col.title}</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-star/75 transition hover:text-star">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-star/55 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Your birth data is yours. You can read a full chart without an account, and delete saved
            charts anytime.
          </p>
          <div className="flex items-center gap-5">
            <a href="mailto:hello@onesky.app" className="transition hover:text-star">
              Contact
            </a>
            <span>© {year} OneSky</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
