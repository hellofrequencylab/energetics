import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getBirthEvent, getProfile, listSavedCharts } from "@/lib/db/queries";
import { SynastryForm, fromSaved, type Person, type SavedChart } from "@/components/SynastryForm";

export const metadata = {
  title: "Resonance · ONESKY",
  description: "Compare two charts: shared ground, complementary tensions, and cross-chart aspects.",
};
export const runtime = "nodejs";

export default async function SynastryPage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const { a, b } = await searchParams;
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
    <main className="mx-auto w-full max-w-4xl px-5 py-12 sm:py-16">
      <Link href="/account" className="text-xs text-muted hover:text-foreground">
        ← Account
      </Link>
      <div className="mb-8 mt-4 text-center">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-accent">Resonance</p>
        <h1 className="text-3xl font-bold sm:text-4xl">Two charts, one field.</h1>
        <p className="mx-auto mt-3 max-w-xl text-muted">
          Where two people share emphasis, where they pull to opposite poles, and how their planets
          aspect each other. Fully attributed, never a single compatibility score.
        </p>
        {saved.length > 0 && (
          <p className="mx-auto mt-3 max-w-xl text-sm text-accent">
            Tip: pick from your saved charts at the top of each side.
          </p>
        )}
      </div>
      <SynastryForm savedCharts={saved} initialA={initialA} initialB={initialB} />
    </main>
  );
}
