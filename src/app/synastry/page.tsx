import { createClient } from "@/lib/supabase/server";
import { getBirthEvent, getProfile, listSavedCharts } from "@/lib/db/queries";
import { SynastryForm, fromSaved, type Person, type ResonanceMode, type SavedChart } from "@/components/SynastryForm";
import { SiteShell } from "@/components/site/SiteShell";
import { AppSectionNav } from "@/components/site/AppSectionNav";
import { PageHeader } from "@/components/ui";

export const metadata = {
  title: "Resonance · ONESKY",
  description: "Compare two charts: shared ground, complementary tensions, and cross-chart aspects.",
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

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      saved = await listSavedCharts(supabase).catch(() => []);
      const profile = await getProfile(supabase, user.id).catch(() => null);

      const aId = a;
      // If only one chart is named, compare it against My Sky by default.
      const bId =
        b ?? (aId && profile?.primary_chart_id && profile.primary_chart_id !== aId
          ? profile.primary_chart_id
          : undefined);

      if (aId) {
        const row = await getBirthEvent(supabase, aId).catch(() => null);
        if (row) initialA = fromSaved(row);
      }
      if (bId) {
        const row = await getBirthEvent(supabase, bId).catch(() => null);
        if (row) initialB = fromSaved(row);
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
      <SynastryForm savedCharts={saved} initialA={initialA} initialB={initialB} initialMode={resonanceMode} />
    </SiteShell>
  );
}
