import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { allMeta } from "@/lib/core/registry";
import { ConvergenceGraph } from "@/components/marketing/ConvergenceGraph";
import { Starfield } from "@/components/marketing/Starfield";
import { Reveal } from "@/components/marketing/Reveal";
import { CenterCTA } from "@/components/marketing/CenterCTA";
import { CountUp } from "@/components/marketing/CountUp";
import { WelcomeShell } from "@/components/marketing/WelcomeShell";

export const metadata: Metadata = {
  title: "OneSky · Many traditions. One sky.",
  description:
    "See your birth moment through every tradition, and where they agree. OneSky keeps each system whole, then shows only the overlap that is real.",
};

const CTA_LABEL = "See your sky, free";

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

const ctaPrimary =
  "inline-block rounded-[12px] bg-horizon-amber px-7 py-3.5 text-base font-semibold text-ink shadow-[0_10px_45px_-10px_rgba(231,177,126,0.6)] transition-[transform,filter] duration-[160ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:brightness-110";

const eyebrow = "text-xs font-semibold uppercase tracking-[0.3em] text-horizon-amber";

export default function WelcomePage() {
  const counts = lineageCounts();

  const hero = (
    <>
      <header className="sticky top-0 z-30 border-b border-white/5 bg-midnight/60 backdrop-blur">
        <nav className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-3">
          <Link href="/welcome" className="flex items-center gap-2" aria-label="OneSky home">
            <ConvergenceGraph animated={false} className="h-6 w-8" label="OneSky" />
            <span className="text-sm font-semibold uppercase tracking-[0.3em]">ONESKY</span>
          </Link>
          <div className="hidden items-center gap-6 text-sm text-star/70 sm:flex">
            <a href="#how" className="hover:text-star">How it works</a>
            <a href="#systems" className="hover:text-star">The systems</a>
            <Link href="/help" className="hover:text-star">Help</Link>
            <Link href="/account" className="hover:text-star">Account</Link>
          </div>
          <CenterCTA className="rounded-[10px] bg-horizon-amber px-4 py-2 text-sm font-semibold text-ink transition hover:brightness-110">
            {CTA_LABEL}
          </CenterCTA>
        </nav>
      </header>

      {/* Cinematic hero. isolate + positive z so the photo layers correctly. */}
      <section className="relative isolate flex min-h-[80svh] items-center overflow-hidden bg-midnight">
        <div className="absolute inset-0 par-slow">
          <Image src="/hero-sky.jpg" alt="" fill priority sizes="100vw" className="kenburns object-cover" />
        </div>
        <div
          className="absolute inset-0"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(58% 45% at 50% 50%, rgba(8,8,18,0.5), transparent 74%), linear-gradient(to bottom, rgba(18,21,53,0.25) 0%, rgba(18,21,53,0.05) 28%, rgba(18,21,53,0.82) 88%, var(--midnight) 100%)",
          }}
        />
        <Starfield count={36} className="absolute inset-0 opacity-50" />

        <div className="relative z-10 mx-auto max-w-2xl px-5 py-12 text-center">
          <div className="relative mx-auto mb-6 aspect-[5/4] w-full max-w-xs">
            <svg
              viewBox="0 0 400 320"
              className="spin-slow absolute inset-0 h-full w-full opacity-40"
              style={{ "--spin-dur": "100s" } as React.CSSProperties}
              aria-hidden="true"
            >
              <ellipse cx="200" cy="160" rx="158" ry="120" fill="none" stroke="var(--horizon-amber)" strokeOpacity="0.22" strokeWidth="0.6" />
              <ellipse cx="200" cy="160" rx="125" ry="95" fill="none" stroke="var(--star)" strokeOpacity="0.12" strokeWidth="0.5" strokeDasharray="2 7" />
            </svg>
            <ConvergenceGraph className="relative h-full w-full" />
          </div>

          <h1 className="font-display text-5xl font-semibold leading-[1.02] tracking-tight sm:text-7xl">
            Many traditions. <span className="shimmer-text">One sky.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-star/85 sm:text-xl">
            See your birth moment through every tradition, and read where they agree.
          </p>
          <div className="mt-9 flex flex-col items-center gap-3">
            <CenterCTA className={ctaPrimary}>{CTA_LABEL}</CenterCTA>
            <p className="text-sm text-star/55">Your birth data stays yours.</p>
          </div>
        </div>

        <CenterCTA
          ariaLabel="Scroll to begin"
          className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-star/50 transition hover:text-star"
        >
          <svg viewBox="0 0 24 14" className="float h-3.5 w-7" aria-hidden="true">
            <path d="M2 3 L12 11 L22 3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </CenterCTA>
      </section>
    </>
  );

  const sections = (
    <>
      <section className="px-5 py-24 text-center sm:py-28">
        <Reveal>
          <p className="mx-auto max-w-2xl font-display text-2xl leading-snug text-star/90 sm:text-3xl">
            You have read your horoscope. You have outgrown it. The sky has more to say, and it
            speaks in more than one language.
          </p>
        </Reveal>
      </section>

      <section id="how" className="relative isolate scroll-mt-20 overflow-hidden border-t border-white/5 px-5 py-24 sm:py-28">
        <Starfield count={24} className="par-fast absolute inset-0 -z-10 opacity-25" />
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <div className="text-center">
              <p className={eyebrow}>Three steps</p>
              <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">How it works</h2>
            </div>
          </Reveal>
          <ol className="mt-12 grid gap-6 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <Reveal key={i} delay={i * 120}>
                <li className="h-full rounded-[16px] border border-white/10 bg-dusk/25 p-6 transition duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:border-horizon-amber/40 hover:bg-dusk/40">
                  <span className="font-mono text-sm text-horizon-amber">{`0${i + 1}`}</span>
                  <h3 className="mt-3 font-display text-xl font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-star/70">{s.body}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section
        className="border-t border-white/5 px-5 py-28"
        style={{
          background:
            "radial-gradient(90% 70% at 50% 50%, rgba(138,125,176,0.16), transparent 70%), var(--midnight)",
        }}
      >
        <div className="mx-auto grid max-w-5xl items-center gap-12 sm:grid-cols-2">
          <Reveal>
            <div className="float">
              <ConvergenceGraph animated={false} className="mx-auto w-full max-w-sm" />
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div>
              <p className={eyebrow}>The difference</p>
              <h2 className="mt-3 font-display text-3xl font-semibold leading-tight sm:text-4xl">
                When separate traditions land on the same truth
              </h2>
              <p className="mt-5 text-star/75">
                OneSky keeps each system apart, then shows only the overlap that is real. The
                agreement means something because nothing was nudged to create it. We rank what you
                see by how many independent traditions point the same way, and we always tell you
                which one said what.
              </p>
              <p className="mt-4 text-star/75">No other reading does this.</p>
              <CenterCTA className={`mt-8 ${ctaPrimary}`}>{CTA_LABEL}</CenterCTA>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="systems" className="scroll-mt-20 bg-bone px-5 py-28 text-ink">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#9a7b53]">Integrity</p>
            <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
              Each tradition, true to its roots
            </h2>
            <p className="mt-5 text-ink/75">
              OneSky reads {counts.total} traditions today. We name the lineage of every one. Living
              traditions are honored as they are. Modern reconstructions are labeled as such, and
              some are shown for interest while staying out of the structural synthesis, so a recent
              invention never poses as an ancient lineage.
            </p>
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              { n: counts.traditional, label: "Living traditions" },
              { n: counts.hybrid, label: "Hybrids" },
              { n: counts.modernReconstruction, label: "Modern reconstructions" },
            ].map((stat, i) => (
              <Reveal key={i} delay={i * 120}>
                <div className="rounded-[16px] border border-ink/10 bg-white/60 p-6 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
                  <div className="font-display text-4xl font-semibold">
                    <CountUp to={stat.n} />
                  </div>
                  <div className="mt-1 text-sm text-ink/70">{stat.label}</div>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={200}>
            <Link href="/help#systems" className="mt-8 inline-block text-sm font-semibold text-ink underline underline-offset-4">
              See every system
            </Link>
          </Reveal>
        </div>
      </section>

      <section className="relative isolate overflow-hidden px-5 py-28 text-center" style={{ background: "radial-gradient(120% 90% at 50% 0%, rgba(231,177,126,0.2), transparent 60%), var(--midnight)" }}>
        <Starfield count={30} className="absolute inset-0 -z-10 opacity-50" />
        <Reveal>
          <div className="mx-auto max-w-2xl">
            <div className="float mx-auto mb-8 w-40">
              <ConvergenceGraph animated={false} className="w-full" />
            </div>
            <h2 className="font-display text-3xl font-semibold leading-tight sm:text-5xl">
              Read everything the sky has to say.
            </h2>
            <CenterCTA className={`mt-8 ${ctaPrimary}`}>{CTA_LABEL}</CenterCTA>
          </div>
        </Reveal>
      </section>
    </>
  );

  const footer = (
    <>
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
            <Link href="/help" className="hover:text-star">Help</Link>
            <Link href="/about" className="hover:text-star">About</Link>
            <a href="mailto:hello@onesky.app" className="hover:text-star">Contact</a>
          </div>
        </div>
        <p className="mx-auto mt-8 w-full max-w-5xl text-star/40">Your birth data stays yours.</p>
      </footer>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-midnight/95 p-3 backdrop-blur sm:hidden">
        <CenterCTA className="block w-full rounded-[12px] bg-horizon-amber px-5 py-3 text-center text-base font-semibold text-ink">
          {CTA_LABEL}
        </CenterCTA>
      </div>
    </>
  );

  return (
    <div className="bg-midnight text-star">
      <WelcomeShell hero={hero} sections={sections} footer={footer} />
    </div>
  );
}
