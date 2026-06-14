import type { Metadata } from "next";
import Link from "next/link";
import { allMeta } from "@/lib/core/registry";
import { ConvergenceGraph } from "@/components/marketing/ConvergenceGraph";

export const metadata: Metadata = {
  title: "OneSky · Many traditions. One sky.",
  description:
    "See your birth moment through every tradition, and where they agree. OneSky keeps each system whole, then shows only the overlap that is real.",
};

const CTA_HREF = "/";
const CTA_LABEL = "See your sky, free";

// Real counts from the engine, so the integrity story never overstates.
function lineageCounts(): {
  total: number;
  traditional: number;
  hybrid: number;
  modernReconstruction: number;
} {
  const meta = allMeta();
  let traditional = 0;
  let hybrid = 0;
  let modernReconstruction = 0;
  for (const m of meta) {
    if (m.lineage === "traditional") traditional++;
    else if (m.lineage === "hybrid") hybrid++;
    else if (m.lineage === "modern-reconstruction") modernReconstruction++;
  }
  return { total: meta.length, traditional, hybrid, modernReconstruction };
}

const STEPS = [
  {
    title: "Enter your birth moment",
    body: "Your date is enough to begin. Add your time and place to unlock more of the chart.",
  },
  {
    title: "See every tradition, kept whole",
    body: "Each system reads your chart on its own terms. Nothing is averaged into one number.",
  },
  {
    title: "Watch them converge",
    body: "We show where independent traditions agree about you, and where they pull apart.",
  },
];

export default function WelcomePage() {
  const counts = lineageCounts();

  return (
    <div className="flex min-h-full flex-col bg-midnight text-star">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-white/5 bg-midnight/80 backdrop-blur">
        <nav className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-3">
          <Link href="/welcome" className="flex items-center gap-2" aria-label="OneSky home">
            <ConvergenceGraph animated={false} className="h-6 w-8" label="OneSky" />
            <span className="text-sm font-semibold uppercase tracking-[0.3em]">ONESKY</span>
          </Link>
          <div className="hidden items-center gap-6 text-sm text-star/70 sm:flex">
            <a href="#how" className="hover:text-star">How it works</a>
            <a href="#systems" className="hover:text-star">The systems</a>
            <Link href="/help" className="hover:text-star">Help</Link>
          </div>
          <Link
            href={CTA_HREF}
            className="rounded-[10px] bg-horizon-amber px-4 py-2 text-sm font-semibold text-ink transition hover:brightness-110"
          >
            {CTA_LABEL}
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section
          className="relative overflow-hidden px-5 pb-20 pt-16 text-center sm:pt-24"
          style={{
            background:
              "radial-gradient(120% 80% at 50% 118%, rgba(231,177,126,0.20), transparent 60%), var(--midnight)",
          }}
        >
          <div className="mx-auto max-w-2xl">
            <ConvergenceGraph className="mx-auto mb-10 w-full max-w-sm" />
            <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
              Many traditions. One sky.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-star/75">
              See your birth moment through every tradition, and where they agree.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3">
              <Link
                href={CTA_HREF}
                className="rounded-[12px] bg-horizon-amber px-7 py-3.5 text-base font-semibold text-ink transition hover:brightness-110"
              >
                {CTA_LABEL}
              </Link>
              <p className="text-sm text-star/50">Your birth data stays yours.</p>
            </div>
          </div>
        </section>

        {/* Empathy beat */}
        <section className="px-5 py-20 text-center">
          <p className="mx-auto max-w-2xl font-display text-2xl leading-snug text-star/90 sm:text-3xl">
            You have read your horoscope. You have outgrown it. The sky has more to say, and it
            speaks in more than one language.
          </p>
        </section>

        {/* How it works */}
        <section id="how" className="scroll-mt-20 border-t border-white/5 px-5 py-20">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center font-display text-3xl font-semibold sm:text-4xl">
              How it works
            </h2>
            <ol className="mt-12 grid gap-8 sm:grid-cols-3">
              {STEPS.map((s, i) => (
                <li key={i} className="rounded-[14px] border border-white/10 bg-dusk/30 p-6">
                  <span className="font-mono text-sm text-horizon-amber">{`0${i + 1}`}</span>
                  <h3 className="mt-3 font-display text-xl font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-star/70">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Convergence showcase */}
        <section
          className="border-t border-white/5 px-5 py-24"
          style={{
            background:
              "radial-gradient(90% 70% at 50% 50%, rgba(138,125,176,0.14), transparent 70%), var(--midnight)",
          }}
        >
          <div className="mx-auto grid max-w-5xl items-center gap-12 sm:grid-cols-2">
            <ConvergenceGraph animated={false} className="mx-auto w-full max-w-sm" />
            <div>
              <h2 className="font-display text-3xl font-semibold leading-tight sm:text-4xl">
                When separate traditions land on the same truth
              </h2>
              <p className="mt-5 text-star/75">
                OneSky keeps each system apart, then shows only the overlap that is real. The
                agreement means something because nothing was nudged to create it. We rank what you
                see by how many independent traditions point the same way, and we always tell you
                which one said what.
              </p>
              <p className="mt-4 text-star/75">No other reading does this.</p>
              <Link
                href={CTA_HREF}
                className="mt-8 inline-block rounded-[12px] bg-horizon-amber px-6 py-3 text-sm font-semibold text-ink transition hover:brightness-110"
              >
                {CTA_LABEL}
              </Link>
            </div>
          </div>
        </section>

        {/* Systems and integrity, on bone */}
        <section id="systems" className="scroll-mt-20 bg-bone px-5 py-24 text-ink">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-display text-3xl font-semibold sm:text-4xl">
              Each tradition, true to its roots
            </h2>
            <p className="mt-5 text-ink/75">
              OneSky reads {counts.total} traditions today. We name the lineage of every one. Living
              traditions are honored as they are. Modern reconstructions are labeled as such, and
              some are shown for interest while staying out of the structural synthesis, so a recent
              invention never poses as an ancient lineage.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-[14px] border border-ink/10 bg-white/40 p-5">
                <div className="font-display text-3xl font-semibold">{counts.traditional}</div>
                <div className="mt-1 text-sm text-ink/70">Living traditions</div>
              </div>
              <div className="rounded-[14px] border border-ink/10 bg-white/40 p-5">
                <div className="font-display text-3xl font-semibold">{counts.hybrid}</div>
                <div className="mt-1 text-sm text-ink/70">Hybrids</div>
              </div>
              <div className="rounded-[14px] border border-ink/10 bg-white/40 p-5">
                <div className="font-display text-3xl font-semibold">
                  {counts.modernReconstruction}
                </div>
                <div className="mt-1 text-sm text-ink/70">Modern reconstructions</div>
              </div>
            </div>
            <Link href="/help#systems" className="mt-8 inline-block text-sm font-semibold text-ink underline">
              See every system
            </Link>
          </div>
        </section>

        {/* Final CTA */}
        <section
          className="px-5 py-24 text-center"
          style={{
            background:
              "radial-gradient(120% 90% at 50% 0%, rgba(231,177,126,0.18), transparent 60%), var(--midnight)",
          }}
        >
          <div className="mx-auto max-w-2xl">
            <ConvergenceGraph animated={false} className="mx-auto mb-8 w-40" />
            <h2 className="font-display text-3xl font-semibold leading-tight sm:text-5xl">
              Read everything the sky has to say.
            </h2>
            <Link
              href={CTA_HREF}
              className="mt-8 inline-block rounded-[12px] bg-horizon-amber px-7 py-3.5 text-base font-semibold text-ink transition hover:brightness-110"
            >
              {CTA_LABEL}
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 px-5 py-12 text-sm text-star/60">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-star">
              <ConvergenceGraph animated={false} className="h-5 w-7" label="OneSky" />
              <span className="text-sm font-semibold uppercase tracking-[0.3em]">ONESKY</span>
            </div>
            <p className="mt-2">Many traditions. One sky.</p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link href="/" className="hover:text-star">Open the app</Link>
            <Link href="/help" className="hover:text-star">Help</Link>
            <Link href="/about" className="hover:text-star">About</Link>
            <a href="mailto:hello@onesky.app" className="hover:text-star">Contact</a>
          </div>
        </div>
        <p className="mx-auto mt-8 w-full max-w-5xl text-star/40">
          Your birth data stays yours.
        </p>
      </footer>

      {/* Sticky mobile CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-midnight/95 p-3 backdrop-blur sm:hidden">
        <Link
          href={CTA_HREF}
          className="block rounded-[12px] bg-horizon-amber px-5 py-3 text-center text-base font-semibold text-ink"
        >
          {CTA_LABEL}
        </Link>
      </div>
    </div>
  );
}
