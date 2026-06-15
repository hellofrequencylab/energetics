import { intake } from "@/lib/core/birth-event";
import { computeChart } from "@/lib/compute";
import { effectiveEnabledIds } from "@/lib/core/system-settings";
import { computeSynastry } from "@/lib/synastry";
import { resonanceNarration, type ResonanceMode, NARRATIVE_MODEL } from "@/lib/synthesis/narrative";
import { streamNarration, NARRATIVE_MAX_TOKENS } from "@/lib/synthesis/narrate-stream";
import { openNarrateGate } from "@/lib/ai/guard";
import { estimateGenerationCostUsd } from "@/lib/ai/pricing";

export const runtime = "nodejs";
// The reading streams with adaptive thinking; allow time for the model.
export const maxDuration = 120;

/**
 * POST /api/synastry/narrate
 * Body: { a: birthIntake, b: birthIntake, mode: "platonic" | "intimate" }.
 * Computes both charts, runs the deterministic resonance comparison, then streams
 * the prose reading over it through the chosen lens. Cached per comparison + lens.
 *
 * Free for 3 runs, then OneSky Plus (enforced by the gate). Cache hits are free.
 */
export async function POST(request: Request) {
  const gate = await openNarrateGate(request, "resonance");
  if (!gate.ok) return gate.response;
  let body: { a?: unknown; b?: unknown; mode?: string };
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON body.", { status: 400 });
  }

  let eventA, eventB, nameA, nameB;
  try {
    ({ event: eventA, name: nameA } = intake(body.a));
    ({ event: eventB, name: nameB } = intake(body.b));
  } catch (err) {
    return new Response(`Validation failed. ${err instanceof Error ? err.message : String(err)}`, { status: 422 });
  }

  const only = await effectiveEnabledIds();
  const a = computeChart(eventA, { only });
  const b = computeChart(eventB, { only });
  const synastry = computeSynastry(a.computations, b.computations);
  const mode: ResonanceMode = body.mode === "intimate" ? "intimate" : "platonic";

  const req = resonanceNarration({ mode, aName: nameA ?? "", bName: nameB ?? "", result: synastry });
  const estCost = estimateGenerationCostUsd({
    model: NARRATIVE_MODEL,
    inputText: req.system + req.prompt,
    maxTokens: NARRATIVE_MAX_TOKENS,
  });
  return streamNarration("resonance", req, { beforeGenerate: () => gate.reserve(estCost) });
}
