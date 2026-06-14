import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { offeredMeta } from "@/lib/core/registry";
import { ConvergenceGraph } from "@/components/marketing/ConvergenceGraph";
import { HeroConvergence } from "@/components/marketing/HeroConvergence";
import { Starfield } from "@/components/marketing/Starfield";
import { Reveal } from "@/components/marketing/Reveal";
import { CenterCTA } from "@/components/marketing/CenterCTA";
import { CountUp } from "@/components/marketing/CountUp";
import { WelcomeShell } from "@/components/marketing/WelcomeShell";
import { SiteFooter } from "@/components/site/SiteFooter";

export const metadata: Metadata = {
  title: "OneSky · Many traditions. One sky.",
  description:
    "Read your birth chart across Western astrology, Human Design, numerology, the Maya calendar, Chinese BaZi, and Tarot at once. OneSky keeps each system whole, then shows the few things they independently agree on about you. Free to read.",
};

const CTA_LABEL = "Read my chart, free";

function lineageCounts(): {
  total: number;
  traditional: number;
  hybrid: number;
  modernReconstruction: number;
} {
  const meta = offeredMeta();
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
    body: "Your date is all it takes to start. Add your exact time and birthplace to unlock your houses, your angles, and the time-based systems.",
  },
  {
    title: "Every tradition reads you, on its own",
    body: "Western astrology, Human Design, numerology, the Maya count, Chinese BaZi, and Tarot each read your chart in their own voice, with nothing shared between them.",
  },
  {
    title: "See where they converge",
    body: "We surface the themes independent traditions reach on their own. The more of them that agree, the more it means, and we always show you which said what.",
  },
];

const BENEFITS = [
  {
    title: "Many traditions, read in full",
    body: "Not one horoscope. Your chart computed across six core systems, each drawn the way it is drawn in real life.",
  },
  {
    title: "A reading that writes itself",
    body: "A clear, grounded write-up of what your systems agree on, in plain language. It reads the chart, it never makes things up.",
  },
  {
    title: "Resonance with others",
    body: "Compare any two charts: where you meet, and where you balance each other. Choose a platonic or an intimate lens.",
  },
  {
    title: "Yours, and private",
    body: "Read a full chart free, with no account. Save charts under your account and they stay protected, so only you can see them.",
  },
];

const ctaPrimary =
  "inline-block rounded-[12px] bg-horizon-amber px-7 py-3.5 text-base font-semibold text-ink [text-shadow:0_1px_0_rgba(255,255,255,0.5)] shadow-[0_10px_45px_-10px_rgba(231,177,126,0.6)] transition-[transform,filter] duration-[160ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:brightness-110";

const eyebrow = "text-xs font-semibold uppercase tracking-[0.3em] text-horizon-amber";

export default function WelcomePage() {
  const counts = lineageCounts();

  const hero = (
    <>
      <header
        data-welcome-header
        className="sticky top-0 z-30 border-b border-white/5 bg-midnight/60 backdrop-blur"
      >
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
          <CenterCTA className="rounded-[10px] bg-horizon-amber px-4 py-2 text-sm font-semibold text-ink [text-shadow:0_1px_0_rgba(255,255,255,0.5)] transition hover:brightness-110">
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
              "radial-gradient(62% 52% at 50% 48%, rgba(6,8,20,0.6), transparent 72%), linear-gradient(to bottom, rgba(18,21,53,0.25) 0%, rgba(18,21,53,0.08) 28%, rgba(18,21,53,0.85) 88%, var(--midnight) 100%)",
          }}
        />
        <Starfield count={30} className="absolute inset-0 z-0 opacity-40" />
        <HeroConvergence className="pointer-events-none absolute inset-0 z-0" />
        {/* Blue gradient fading the hero into the page below. */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-48"
          aria-hidden="true"
          style={{
            background:
              "linear-gradient(to bottom, transparent 0%, rgba(42,44,90,0.35) 45%, var(--midnight) 100%)",
          }}
        />

        <div className="relative z-10 mx-auto max-w-2xl px-5 py-12 text-center">
          <h1 className="font-display text-5xl font-semibold leading-[1.02] tracking-tight [text-shadow:0_2px_30px_rgba(6,8,20,0.65)] sm:text-7xl">
            Many traditions. <span className="shimmer-text">One sky.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-star/95 [text-shadow:0_1px_18px_rgba(6,8,20,0.8)] sm:text-xl">
            Your birth chart, read across astrology, Human Design, numerology, and more, all at once.
            See the few things they independently agree on about you, and where they pull apart.
          </p>
          <div className="mt-9 flex flex-col items-center gap-3">
            <CenterCTA className={ctaPrimary}>{CTA_LABEL}</CenterCTA>
            <p className="text-sm text-star/70 [text-shadow:0_1px_12px_rgba(6,8,20,0.8)]">
              Free to read. No account needed. Your birth data stays yours.
            </p>
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
          <p className="mx-auto max-w-2xl font-display text-2xl leading-snug text-star sm:text-3xl">
            One horoscope, one system, one voice. You have outgrown it. Your birth moment holds far
            more, and every tradition reads it differently. OneSky reads them all at once, then
            listens for what they say in unison.
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
                <li className="h-full rounded-[16px] border border-white/10 bg-dusk/30 p-6 transition duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:border-horizon-amber/40 hover:bg-dusk/45">
                  <span className="font-mono text-sm text-horizon-amber">{`0${i + 1}`}</span>
                  <h3 className="mt-3 font-display text-xl font-semibold">{s.title}</h3>
                  <p className="mt-2 text-base leading-relaxed text-star/85">{s.body}</p>
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
              <p className={eyebrow}>Why it is different</p>
              <h2 className="mt-3 font-display text-3xl font-semibold leading-tight sm:text-4xl">
                When separate traditions land on the same truth
              </h2>
              <p className="mt-5 text-base leading-relaxed text-star/85">
                Most apps blend everything into one number and lose the plot. OneSky does the
                opposite. It keeps each tradition whole and independent, then shows you only the
                overlap that is real. Because nothing is nudged to agree, agreement actually means
                something. We rank what you see by how many independent sources point the same way,
                and we always name which one said it.
              </p>
              <p className="mt-4 font-medium text-star/90">Nothing else reads you this way.</p>
              <CenterCTA className={`mt-8 ${ctaPrimary}`}>{CTA_LABEL}</CenterCTA>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="border-t border-white/5 px-5 py-24 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <div className="text-center">
              <p className={eyebrow}>What you get</p>
              <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
                A whole self-portrait, not a daily horoscope
              </h2>
            </div>
          </Reveal>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {BENEFITS.map((b, i) => (
              <Reveal key={i} delay={i * 100}>
                <div className="h-full rounded-[16px] border border-white/10 bg-dusk/30 p-6 transition duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:border-horizon-amber/40 hover:bg-dusk/45">
                  <h3 className="font-display text-xl font-semibold">{b.title}</h3>
                  <p className="mt-2 text-base leading-relaxed text-star/85">{b.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={200}>
            <p className="mt-10 text-center text-sm text-star/60">
              Real astronomy under the hood: planetary positions from the Swiss Ephemeris, the same
              engine trusted by serious astrologers.
            </p>
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
            <p className="mt-5 text-base leading-relaxed text-ink/85">
              OneSky reads {counts.total} traditions today, and we name the lineage of every one.
              Living traditions are honored as they are. Modern reconstructions are labeled as such,
              and some are shown for interest while staying out of the synthesis, so a recent
              invention never poses as an ancient lineage. We treat every reading as a way to
              reflect, never as fixed fate.
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
                  <div className="mt-1 text-sm font-medium text-ink/80">{stat.label}</div>
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
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-star/80">
              Start with your date. Your first reading is free, and it is yours to keep.
            </p>
            <CenterCTA className={`mt-8 ${ctaPrimary}`}>{CTA_LABEL}</CenterCTA>
          </div>
        </Reveal>
      </section>
    </>
  );

  const footer = (
    <>
      <SiteFooter />

      <div
        data-welcome-cta
        className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-midnight/95 p-3 backdrop-blur sm:hidden"
      >
        <CenterCTA className="block w-full rounded-[12px] bg-horizon-amber px-5 py-3 text-center text-base font-semibold text-ink [text-shadow:0_1px_0_rgba(255,255,255,0.5)]">
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
