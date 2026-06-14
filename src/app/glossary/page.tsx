import { SiteShell } from "@/components/site/SiteShell";
import { GlossarySearch } from "@/components/glossary/GlossarySearch";

export const metadata = {
  title: "Glossary · ONESKY",
  description: "Search the interpretation corpus: signs, planets, numbers, day-signs, tones, and arcana.",
};

export default async function GlossaryPage() {
  return (
    <SiteShell width="max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Glossary</p>
      <h1 className="mb-2 mt-2 font-display text-3xl font-semibold sm:text-4xl">Look anything up</h1>
      <p className="mb-6 text-muted">
        Search the interpretation corpus: signs, planets, numbers, day-signs, tones, and arcana.
      </p>
      <GlossarySearch />
    </SiteShell>
  );
}
