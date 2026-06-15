import { themeNarration, NARRATIVE_MODEL } from "@/lib/synthesis/narrative";
import { streamNarration, NARRATIVE_MAX_TOKENS } from "@/lib/synthesis/narrate-stream";
import { openNarrateGate } from "@/lib/ai/guard";
import { estimateGenerationCostUsd } from "@/lib/ai/pricing";

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
 *
 * Drill-down is a OneSky Plus feature (enforced by the gate); free readers see
 * the structural theme above without the prose deep-dive.
 */
export async function POST(request: Request) {
  const gate = await openNarrateGate(request, "theme");
  if (!gate.ok) return gate.response;
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

  // Bound every field so this route cannot be used as an open relay to the model:
  // the structural inputs are short axis/value tokens and a handful of system ids.
  if (
    typeof axis !== "string" ||
    axis.length > 64 ||
    typeof value !== "string" ||
    value.length > 64 ||
    !Array.isArray(systems) ||
    systems.length > 40 ||
    !systems.every((s) => typeof s === "string" && s.length <= 64)
  ) {
    return new Response("Invalid request.", { status: 400 });
  }

  const req = themeNarration({
    axis,
    value,
    systems,
    selfName: typeof selfName === "string" ? selfName.slice(0, 80) : undefined,
  });
  const estCost = estimateGenerationCostUsd({
    model: NARRATIVE_MODEL,
    inputText: req.system + req.prompt,
    maxTokens: NARRATIVE_MAX_TOKENS,
  });
  return streamNarration("chart", req, { beforeGenerate: () => gate.reserve(estCost) });
}
