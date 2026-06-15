import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/admin";
import { NARRATIVE_MODEL, narrationKey, type NarrationRequest } from "./narrative";

/**
 * Stream a narration as plain text, serving from the cache when present and
 * caching fresh output server-side. Both routes (chart + resonance) share this.
 *
 * Metadata travels in response headers so the body stays clean prose:
 *   x-narrative-available  "true" | "false"  (false = not configured)
 *   x-narrative-cached     "true" | "false"
 *   x-narrative-model      the model id, when prose was produced
 *
 * Translate, never compute: the request is built from the deterministic
 * structure only (see narrative.ts), so the cache key content-addresses it.
 */

type Kind = "chart" | "resonance";

const NOT_CONFIGURED =
  "The reading is not configured yet. The convergences and tensions above are computed without a model and need no setup. Add an API key to turn on the prose layer.";

function headersFor(meta: { available: boolean; cached: boolean; model?: string }): Headers {
  const h = new Headers({
    "content-type": "text/plain; charset=utf-8",
    "cache-control": "no-store",
    "x-narrative-available": String(meta.available),
    "x-narrative-cached": String(meta.cached),
  });
  if (meta.model) h.set("x-narrative-model", meta.model);
  return h;
}

async function readCache(key: string): Promise<string | null> {
  try {
    // Read with the service role, never the per-request client. A reading can
    // mention user-entered names (resonance, theme), so the cache table is not
    // exposed to anon/authenticated. Without a service key the cache is simply
    // off and readings regenerate, which is the same graceful degrade as writes.
    const admin = createAdminClient();
    if (!admin) return null;
    const { data } = await admin.from("narratives").select("body").eq("cache_key", key).maybeSingle();
    return (data?.body as string | undefined) ?? null;
  } catch {
    return null;
  }
}

/**
 * Read a saved reading for this request, without generating one. Used to render a
 * saved chart's reading immediately on the server, so it shows at once and is not
 * rewritten on every visit.
 */
export async function getCachedNarration(
  req: NarrationRequest,
): Promise<{ text: string; model: string } | null> {
  const body = await readCache(narrationKey(req));
  return body ? { text: body, model: NARRATIVE_MODEL } : null;
}

async function writeCache(key: string, kind: Kind, body: string): Promise<void> {
  try {
    const admin = createAdminClient();
    if (!admin) return;
    await admin
      .from("narratives")
      .upsert({ cache_key: key, kind, model: NARRATIVE_MODEL, body }, { onConflict: "cache_key" });
  } catch {
    // Best effort: a cache write failure never breaks the reading.
  }
}

export async function streamNarration(kind: Kind, req: NarrationRequest): Promise<Response> {
  const cacheKey = narrationKey(req);

  // 1. Cache hit: return the stored reading instantly, no model call.
  const cached = await readCache(cacheKey);
  if (cached) {
    return new Response(cached, { headers: headersFor({ available: true, cached: true, model: NARRATIVE_MODEL }) });
  }

  // 2. No key: a plain note, not prose. The structural synthesis still stands.
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(NOT_CONFIGURED, { headers: headersFor({ available: false, cached: false }) });
  }

  // 3. Fresh: stream tokens to the client, accumulate, then cache.
  const client = new Anthropic();
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let full = "";
      try {
        const ai = client.messages.stream({
          model: NARRATIVE_MODEL,
          max_tokens: 8000,
          thinking: { type: "adaptive" },
          system: req.system,
          messages: [{ role: "user", content: req.prompt }],
        });
        ai.on("text", (delta) => {
          full += delta;
          controller.enqueue(encoder.encode(delta));
        });
        await ai.finalMessage();
        if (full.trim()) await writeCache(cacheKey, kind, full.trim());
        controller.close();
      } catch {
        const msg = full
          ? "\n\n(The reading was interrupted. Please try again.)"
          : "The reading could not be generated right now. Please try again.";
        controller.enqueue(encoder.encode(msg));
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: headersFor({ available: true, cached: false, model: NARRATIVE_MODEL }) });
}
