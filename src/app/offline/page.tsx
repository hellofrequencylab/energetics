import Link from "next/link";
import { SandMark } from "@/components/ui";

export const metadata = { title: "Offline · OneSky" };

/**
 * The offline fallback the service worker serves when a navigation fails with no
 * network. Deliberately standalone (no SiteShell, which reads auth) so it renders
 * with no connection.
 */
export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center text-foreground">
      <SandMark className="h-16 w-24 opacity-80" />
      <h1 className="mt-5 font-display text-2xl font-semibold">You are offline</h1>
      <p className="mt-2 max-w-sm text-muted">
        OneSky needs a connection to read the sky. Reconnect and try again.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-[10px] border border-border px-4 py-2 text-sm text-foreground/85 transition hover:border-accent/50 hover:text-foreground"
      >
        Retry
      </Link>
    </main>
  );
}
