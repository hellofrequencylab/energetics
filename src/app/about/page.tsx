import { offeredMeta } from "@/lib/core/registry";
import { EthicsPanel } from "@/components/EthicsPanel";
import { SiteShell } from "@/components/site/SiteShell";
import { PageHeader } from "@/components/ui";

export const metadata = {
  title: "About the systems",
  description: "How OneSky treats each tradition: named, lineage-labeled, predisposition not fate.",
  alternates: { canonical: "/about" },
};

export default async function AboutPage() {
  const systems = offeredMeta().map((m) => ({ id: m.id, displayName: m.displayName, lineage: m.lineage }));

  return (
    <SiteShell>
      <PageHeader
        eyebrow="Integrity"
        title="About these systems"
        description="OneSky draws on many traditions. We name each one, label its lineage honestly, and keep modern reconstructions separate from living traditions."
      />
      <EthicsPanel systems={systems} />
    </SiteShell>
  );
}
