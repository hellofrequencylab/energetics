import { createClient } from "@/lib/supabase/server";
import { getBirthEvent, listSavedCharts } from "@/lib/db/queries";
import { currentUser, currentProfile } from "@/lib/auth/session";
import { SynastryForm, fromSaved, type Person, type ResonanceMode, type SavedChart } from "@/components/SynastryForm";
import { SiteShell } from "@/components/site/SiteShell";
import { AppSectionNav } from "@/components/site/AppSectionNav";
import { PageHeader } from "@/components/ui";

export const metadata = {
  title: "Resonance",
  description: "Compare two charts: shared ground, complementary tensions, and cross-chart aspects.",
  alternates: { canonical: "/synastry" },
};
export const runtime = "nodejs";

export default async function SynastryPage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string; mode?: string }>;
}) {
  const { a, b, mode } = await searchParams;
  const resonanceMode: ResonanceMode = mode === "intimate" ? "intimate" : "platonic";
  const supabase = await createClient();

  let saved: SavedChart[] = [];
  let initialA: Person | undefined;
  let initialB: Person | undefined;
  let initialAId: string | undefined;
  let initialBId: string | undefined;
  let signedIn = false;

  if (supabase) {
    const user = await currentUser();
    if (user) {
      signedIn = true;
      const [savedCharts, profile] = await Promise.all([
        listSavedCharts(supabase).catch(() => []),
        currentProfile(),
      ]);
      saved = savedCharts;

      const aId = a;
      // If only one chart is named, compare it against My Sky by default.
      const bId =
        b ?? (aId && profile?.primary_chart_id && profile.primary_chart_id !== aId
          ? profile.primary_chart_id
          : undefined);

      // Both saved charts load in parallel rather than one after the other.
      const [aRow, bRow] = await Promise.all([
        aId ? getBirthEvent(supabase, aId).catch(() => null) : Promise.resolve(null),
        bId ? getBirthEvent(supabase, bId).catch(() => null) : Promise.resolve(null),
      ]);
      if (aId && aRow) {
        initialA = fromSaved(aRow);
        initialAId = aId;
      }
      if (bId && bRow) {
        initialB = fromSaved(bRow);
        initialBId = bId;
      }
    }
  }

  return (
    <SiteShell nav={<AppSectionNav />}>
      <PageHeader
        eyebrow="Resonance"
        title="Two charts, one field."
        description="Where two people share emphasis, where they pull to opposite poles, and how their planets aspect each other. Fully attributed, never a single compatibility score."
      />
      {saved.length > 0 && (
        <p className="-mt-4 mb-8 max-w-prose text-sm text-muted">
          Tip: pick from your saved charts at the top of each side.
        </p>
      )}
      <SynastryForm
        savedCharts={saved}
        initialA={initialA}
        initialB={initialB}
        initialAId={initialAId}
        initialBId={initialBId}
        initialMode={resonanceMode}
        canSave={signedIn}
      />
    </SiteShell>
  );
}
