/**
 * Minimal structured logging: one JSON line per event, greppable in Vercel logs
 * and easy to ship to an aggregator. Keep messages free of PII (no birth data,
 * names, or raw request bodies) — pass a stable `scope` and short fields only.
 *
 * This is the single choke point for server-side errors, so wiring an error
 * tracker (e.g. Sentry) later means editing `logError` here, not every route.
 */
type Level = "error" | "warn" | "info";

function line(level: Level, scope: string, fields: Record<string, unknown>): string {
  return JSON.stringify({ ts: new Date().toISOString(), level, scope, ...fields });
}

/** Log a server-side error: reduces an unknown error to its name + message. */
export function logError(scope: string, err: unknown, meta?: Record<string, unknown>): void {
  const detail =
    err instanceof Error ? { error: err.name, message: err.message } : { message: String(err) };
  console.error(line("error", scope, { ...detail, ...meta }));
}

export function logWarn(scope: string, message: string, meta?: Record<string, unknown>): void {
  console.warn(line("warn", scope, { message, ...meta }));
}

export function logInfo(scope: string, message: string, meta?: Record<string, unknown>): void {
  console.log(line("info", scope, { message, ...meta }));
}
