import Anthropic from "@anthropic-ai/sdk";
import type { ComputedSystem, Synthesis } from "./types";

export interface NarrativeResult {
  available: boolean;
  text: string;
  model?: string;
  note?: string;
}

const NARRATIVE_MODEL = "claude-opus-4-8";

/**
 * NARRATIVE LAYER (spec §9). Turns the ALREADY-computed deterministic synthesis
 * (convergences + tensions) into prose. It reads the structural output — it does
 * NOT compute convergence/tension and never uses embeddings for structure. Soft
 * language on top of hard structure.
 *
 * Degrades gracefully without ANTHROPIC_API_KEY (the deterministic synthesis and
 * per-system data above remain fully usable).
 */
export async function narrate(
  synthesis: Synthesis,
  computations: ComputedSystem[],
): Promise<NarrativeResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      available: false,
      text: "",
      note: "Narrative is not configured. Set ANTHROPIC_API_KEY to generate prose over the computed convergences and tensions. The structural synthesis above is computed deterministically and needs no API key.",
    };
  }

  try {
    const client = new Anthropic();
    const stream = client.messages.stream({
      model: NARRATIVE_MODEL,
      max_tokens: 8000,
      thinking: { type: "adaptive" },
      system: NARRATIVE_SYSTEM,
      messages: [{ role: "user", content: buildPrompt(synthesis, computations) }],
    });
    const message = await stream.finalMessage();
    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
    return { available: true, text, model: message.model };
  } catch (err) {
    return { available: false, text: "", note: `Narrative failed: ${err instanceof Error ? err.message : "unknown error"}.` };
  }
}

const NARRATIVE_SYSTEM = `You are the narrative voice of a multi-system birth-chart engine.

A SEPARATE deterministic layer has already computed the structural synthesis: which themes CONVERGE across independent divinatory systems, and where the systems are in TENSION. Your job is ONLY to narrate that structure in plain, grounded language — you do not compute, infer, or add convergences/tensions that aren't given.

Critical rules:
- Work strictly from the convergences, tensions, and native placements provided.
- "Independent groups" is the key signal: a convergence backed by 2+ independent source groups (e.g. an ephemeris-derived system AND a date-derived system) is a genuinely strong, cross-confirmed theme. Say so. A convergence from a single group is weaker — frame it as one lens, not a verdict.
- Never collapse a tension into a compromise. Hold both poles; explain the lived push-pull.
- No fabricated certainty, no fatalism, no horoscope clichés. Tendencies, not predictions.
- Do not invent a "compatibility number" or any single score.

Structure with markdown headings:
## Strongest Threads  — convergences with the most independent support
## Holding the Tension  — the declared tensions, both sides honored
## A Single Lens  — one integrative paragraph`;

function buildPrompt(synthesis: Synthesis, computations: ComputedSystem[]): string {
  const lines: string[] = [];

  lines.push("# Per-system placements");
  for (const c of computations) {
    const factors = Object.values(c.native.factors);
    if (!factors.length) continue;
    lines.push(`## ${c.meta.displayName} (${c.meta.derivedFrom}-derived)`);
    for (const f of factors) lines.push(`- ${f.label}: ${f.display ?? String(f.value)}`);
  }

  lines.push("\n# Computed convergences (ranked by independent-group support)");
  for (const conv of synthesis.convergences) {
    const sources = [...new Set(conv.contributors.map((a) => a.systemId))].join(", ");
    lines.push(
      `- [${conv.axis}] ${conv.value} — ${conv.independentGroups} independent group(s); sources: ${sources}`,
    );
  }

  lines.push("\n# Computed tensions (declared oppositions, both poles present)");
  if (synthesis.tensions.length === 0) lines.push("- (none)");
  for (const t of synthesis.tensions) {
    const side = (i: number) =>
      `${t.sides[i].value} [${[...new Set(t.sides[i].contributors.map((a) => a.systemId))].join(", ")}]`;
    lines.push(`- [${t.axis}] ${side(0)}  ⟷  ${side(1)}`);
  }

  lines.push("\nNarrate this following your section structure. Lead with the most cross-confirmed threads.");
  return lines.join("\n");
}
