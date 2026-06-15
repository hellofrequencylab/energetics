import type { ReactNode } from "react";
import { SiteShell } from "@/components/site/SiteShell";
import { PageHeader } from "@/components/ui";

export const metadata = {
  title: "Privacy",
  description: "What OneSky collects, how it is used, and how to remove it.",
  alternates: { canonical: "/privacy" },
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      <div className="mt-2 space-y-2 text-foreground/85">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <SiteShell>
      <div className="max-w-prose">
        <PageHeader eyebrow="Privacy" title="Your birth data is yours" description="Last updated 15 June 2026." />

        <p className="text-foreground/85">
          OneSky reads your birth moment across many traditions. This page explains what is collected,
          how it is used, and how to remove it. The short version: you can read a full chart without an
          account, nothing is saved unless you sign in and save it, and we never sell your data.
        </p>

        <Section title="What we collect">
          <p>
            When you compute a chart, you provide a birth date, and optionally a time, a place, and a
            full name. If you do not sign in, this is used in the moment and not stored by us. If you
            create an account, we store your email (to sign you in), the charts you choose to save, your
            profile (a display name and account type), and any notes you add to a chart.
          </p>
        </Section>

        <Section title="How we use it">
          <p>
            Your birth data is used to compute and show your chart, the synthesis across systems, and
            your reading. When you ask for a written reading, the derived structure (the convergences
            and tensions, plus the details you entered) is sent to our AI provider to generate prose. We
            do not use your data to train models.
          </p>
        </Section>

        <Section title="Where it is stored">
          <p>
            Saved data lives in our database (Supabase) under row-level security, so only your account
            can read your charts. The app is hosted on Vercel. Place search uses a geocoding service, and
            readings use an AI provider. These processors handle data only to provide the service.
          </p>
        </Section>

        <Section title="Sharing">
          <p>
            We do not sell your data and do not share it for advertising. We share only with the
            processors above, and only as needed to run OneSky, or when required by law.
          </p>
        </Section>

        <Section title="Your choices">
          <p>
            You can read charts without an account. You can delete any saved chart at any time from your
            account. To delete your account and everything in it, contact us and we will remove it.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions about privacy: <a className="text-accent hover:underline" href="mailto:hello@onesky.app">hello@onesky.app</a>.
          </p>
        </Section>
      </div>
    </SiteShell>
  );
}
