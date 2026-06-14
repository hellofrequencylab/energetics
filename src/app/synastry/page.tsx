import Link from "next/link";
import { SynastryForm } from "@/components/SynastryForm";

export const metadata = {
  title: "Synastry — ONESKY",
  description: "Compare two charts: shared ground, complementary tensions, and cross-chart aspects.",
};

export default function SynastryPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-12 sm:py-16">
      <Link href="/" className="text-xs text-muted hover:text-foreground">
        ← Back
      </Link>
      <div className="mb-8 mt-4 text-center">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-accent">Connections</p>
        <h1 className="text-3xl font-bold sm:text-4xl">Two charts, one field.</h1>
        <p className="mx-auto mt-3 max-w-xl text-muted">
          Where two people share emphasis, where they pull to opposite poles, and how their planets
          aspect each other — fully attributed, never a single compatibility score.
        </p>
      </div>
      <SynastryForm />
    </main>
  );
}
