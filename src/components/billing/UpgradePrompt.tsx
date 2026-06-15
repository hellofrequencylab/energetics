import Link from "next/link";

/**
 * The invitation shown when a free reader reaches a Plus feature or a daily
 * limit (ADR-0008). It leads with what they get, links to the Plus page, and
 * (optionally) offers a low-pressure way to step back. Voice: from the user's
 * side, no em dashes, privacy stated where birth data is involved.
 */
export function UpgradePrompt({
  message,
  cta = "See OneSky Plus",
  href = "/plus",
  onDismiss,
  dismissLabel = "Not now",
  className = "",
}: {
  message: string;
  cta?: string;
  href?: string;
  onDismiss?: () => void;
  dismissLabel?: string;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-horizon-amber/30 bg-horizon-amber/[0.06] p-5 ${className}`}>
      <p className="text-sm leading-relaxed text-foreground/90">{message}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Link
          href={href}
          className="inline-block rounded-lg bg-horizon-amber px-4 py-2 text-sm font-semibold text-ink transition hover:brightness-110"
        >
          {cta}
        </Link>
        {onDismiss && (
          <button onClick={onDismiss} className="text-sm text-muted transition hover:text-foreground">
            {dismissLabel}
          </button>
        )}
      </div>
    </div>
  );
}
