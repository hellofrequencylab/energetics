import { offeredMeta } from "@/lib/core/registry";
import { EthicsPanel } from "@/components/EthicsPanel";
import { SiteShell } from "@/components/site/SiteShell";

export const metadata = {
  title: "About the systems · ONESKY",
  description: "How ONESKY treats each tradition: named, lineage-labeled, predisposition not fate.",
};

export default async function AboutPage() {
  const systems = offeredMeta().map((m) => ({ id: m.id, displayName: m.displayName, lineage: m.lineage }));

  return (
    <SiteShell width="max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Integrity</p>
      <h1 className="mb-2 mt-2 font-display text-3xl font-semibold sm:text-4xl">About these systems</h1>
      <p className="mb-8 max-w-xl text-muted">
        ONESKY draws on many traditions. We name each one, label its lineage honestly, and keep
        modern reconstructions separate from living traditions.
      </p>
      <EthicsPanel systems={systems} />
    </SiteShell>
  );
}
