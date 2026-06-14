import { themeNarration } from "@/lib/synthesis/narrative";
import { streamNarration } from "@/lib/synthesis/narrate-stream";

export const runtime = "nodejs";
// The reading streams with adaptive thinking; allow time for the model.
export const maxDuration = 120;

/**
 * POST /api/themes/narrate
 * Body: { axis, value, systems, selfName? }. Narrates ONE theme that surfaced in
 * the deterministic synthesis, streamed as text/plain. No recompute happens here:
 * the caller passes the already-found theme, the axis it sits on, and the systems
 * that independently landed on it. Cached per request (kind "chart", the only
 * single-chart kind the cache table accepts) so reopening a theme is instant and
 * never re-bills.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid request.", { status: 400 });
  }

  const { axis, value, systems, selfName } = (body ?? {}) as {
    axis?: unknown;
    value?: unknown;
    systems?: unknown;
    selfName?: unknown;
  };

  if (
    typeof axis !== "string" ||
    typeof value !== "string" ||
    !Array.isArray(systems) ||
    !systems.every((s) => typeof s === "string")
  ) {
    return new Response("Invalid request.", { status: 400 });
  }

  return streamNarration(
    "chart",
    themeNarration({
      axis,
      value,
      systems,
      selfName: typeof selfName === "string" ? selfName : undefined,
    }),
  );
}
