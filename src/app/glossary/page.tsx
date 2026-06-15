import { SiteShell } from "@/components/site/SiteShell";
import { GlossarySearch } from "@/components/glossary/GlossarySearch";
import { PageHeader } from "@/components/ui";

export const metadata = {
  title: "Glossary · ONESKY",
  description: "Search the interpretation corpus: signs, planets, numbers, day-signs, tones, and arcana.",
};

export default async function GlossaryPage() {
  return (
    <SiteShell>
      <PageHeader
        eyebrow="Glossary"
        title="Look anything up"
        description="Search the interpretation corpus: signs, planets, numbers, day-signs, tones, and arcana."
      />
      <GlossarySearch />
    </SiteShell>
  );
}
