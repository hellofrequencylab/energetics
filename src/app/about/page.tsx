import Link from "next/link";
import { allMeta } from "@/lib/core/registry";
import { EthicsPanel } from "@/components/EthicsPanel";

export const metadata = {
  title: "About the systems — OneSky",
  description: "How OneSky treats each tradition: named, lineage-labeled, predisposition not fate.",
};

export default function AboutPage() {
  const systems = allMeta().map((m) => ({ id: m.id, displayName: m.displayName, lineage: m.lineage }));

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-12 sm:py-16">
      <Link href="/" className="text-xs text-muted hover:text-foreground">
        ← Back
      </Link>
      <h1 className="mb-2 mt-4 text-2xl font-bold">About these systems</h1>
      <p className="mb-8 max-w-xl text-muted">
        OneSky draws on many traditions. We name each one, label its lineage honestly, and keep
        modern reconstructions separate from living traditions.
      </p>
      <EthicsPanel systems={systems} />
    </main>
  );
}
