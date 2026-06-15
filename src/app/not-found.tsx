import { SiteShell } from "@/components/site/SiteShell";
import { ButtonLink, SandMark } from "@/components/ui";

export const metadata = {
  title: "Not found · ONESKY",
};

/** A calm, on-brand 404 using the convergence sand mark. */
export default function NotFound() {
  return (
    <SiteShell>
      <div className="mx-auto flex max-w-md flex-col items-center py-12 text-center">
        <SandMark className="h-16 w-24 opacity-80" />
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.3em] text-accent">Lost the thread</p>
        <h1 className="mt-2 font-display text-3xl font-semibold">This page is not on the map</h1>
        <p className="mt-2 text-muted">
          The link may be old, or the page may have moved. Let us get you back to a starting point.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <ButtonLink href="/welcome" variant="primary">
            Read your sky
          </ButtonLink>
          <ButtonLink href="/account" variant="secondary">
            Your account
          </ButtonLink>
        </div>
      </div>
    </SiteShell>
  );
}
