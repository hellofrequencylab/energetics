"use client";

import { useEffect } from "react";
import { Button, ButtonLink, SandMark } from "@/components/ui";

/** Route-level error boundary: a calm, on-brand recovery screen. */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Surface for the console / any attached logger; never swallow silently.
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center text-foreground">
      <SandMark className="h-16 w-24 opacity-80" />
      <h1 className="mt-5 font-display text-2xl font-semibold">Something went off course</h1>
      <p className="mt-2 max-w-sm text-muted">
        An unexpected error happened on this page. You can try again, or head back to a starting point.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button variant="primary" onClick={reset}>
          Try again
        </Button>
        <ButtonLink href="/welcome" variant="secondary">
          Home
        </ButtonLink>
      </div>
    </main>
  );
}
