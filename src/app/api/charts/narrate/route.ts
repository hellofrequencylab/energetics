import { intake } from "@/lib/core/birth-event";
import { computeChart } from "@/lib/compute";
import { synthesize } from "@/lib/synthesis";
import { effectiveEnabledIds } from "@/lib/core/system-settings";
import { chartNarration, NARRATIVE_MODEL } from "@/lib/synthesis/narrative";
import { streamNarration, NARRATIVE_MAX_TOKENS } from "@/lib/synthesis/narrate-stream";
import { openNarrateGate } from "@/lib/ai/guard";
import { estimateGenerationCostUsd } from "@/lib/ai/pricing";

export const runtime = "nodejs";
// The reading streams with adaptive thinking; allow time for the model.
export const maxDuration = 120;

/**
 * POST /api/charts/narrate
 * Body: birth intake. Recomputes (cheap), runs the deterministic synthesis, then
 * streams the prose NARRATIVE layer over it as text/plain. Cached per synthesis
 * so reopening a chart is instant and never re-bills. Separate from /compute so
 * the structural map renders immediately and the prose loads on demand.
 *
 * The basic reading is free for everyone (subject to the daily AI quota and the
 * global budget, enforced by the gate). Cache hits never count.
 */
export async function POST(request: Request) {
  const gate = await openNarrateGate(request, "chart");
  if (!gate.ok) return gate.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON body.", { status: 400 });
  }

  let event;
  try {
    ({ event } = intake(body));
  } catch (err) {
    return new Response(`Validation failed. ${err instanceof Error ? err.message : String(err)}`, { status: 422 });
  }

  const only = await effectiveEnabledIds();
  const { computations } = computeChart(event, { only });
  const synthesis = synthesize(event.id, computations);
  const req = chartNarration(synthesis, computations);
  const estCost = estimateGenerationCostUsd({
    model: NARRATIVE_MODEL,
    inputText: req.system + req.prompt,
    maxTokens: NARRATIVE_MAX_TOKENS,
  });
  return streamNarration("chart", req, { beforeGenerate: () => gate.reserve(estCost) });
}
