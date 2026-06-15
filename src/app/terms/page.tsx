import type { ReactNode } from "react";
import { SiteShell } from "@/components/site/SiteShell";
import { PageHeader } from "@/components/ui";

export const metadata = {
  title: "Terms",
  description: "The terms for using OneSky.",
  alternates: { canonical: "/terms" },
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      <div className="mt-2 space-y-2 text-foreground/85">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <SiteShell>
      <div className="max-w-prose">
        <PageHeader eyebrow="Terms" title="Using OneSky" description="Last updated 15 June 2026." />

        <p className="text-foreground/85">
          By using OneSky you agree to these terms. They are meant to be plain and fair.
        </p>

        <Section title="What OneSky is">
          <p>
            OneSky reads symbolic traditions (astrology, Human Design, numerology, and more) from your
            birth moment, and shows where independent systems agree. It is for reflection, insight, and
            curiosity. It is not professional advice, and not a substitute for medical, legal, financial,
            or psychological guidance. Make your own decisions.
          </p>
        </Section>

        <Section title="Your account">
          <p>
            You are responsible for keeping your sign-in secure and for the charts and notes you save.
            Enter data you have the right to use, and be considerate of the privacy of anyone whose chart
            you save.
          </p>
        </Section>

        <Section title="Acceptable use">
          <p>
            Please do not abuse the service: no scraping, automated overloading, attempts to break
            access controls, or use that harms others. We rate-limit the compute and reading endpoints to
            keep OneSky healthy for everyone.
          </p>
        </Section>

        <Section title="Content">
          <p>
            The interpretive writing in OneSky is original. Traditions are honored and described in our
            own words, never reproduced from copyrighted corpora. The convergence and tension structure
            is computed deterministically, and the written reading is prose over that structure.
          </p>
        </Section>

        <Section title="Availability and changes">
          <p>
            OneSky is provided as is, without warranty, and may change or be unavailable at times. We may
            update these terms; significant changes will be noted on this page.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions: <a className="text-accent hover:underline" href="mailto:hello@onesky.app">hello@onesky.app</a>.
          </p>
        </Section>
      </div>
    </SiteShell>
  );
}
