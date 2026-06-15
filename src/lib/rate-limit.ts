/**
 * A small in-memory, per-IP rate limiter for the compute and AI routes. It is a
 * first line of defense (fixed window, token count per IP). On serverless it is
 * per-instance and resets on cold start, so for hard multi-instance limits back
 * it with a shared store (e.g. Upstash). Good enough to blunt abuse and runaway
 * loops today.
 */
type Bucket = { count: number; reset: number };
const buckets = new Map<string, Bucket>();

function clientIp(req: Request): string {
  // Trust only platform-set headers. A client can send an arbitrary
  // X-Forwarded-For, and the edge proxy APPENDS the real peer on the right, so
  // the leftmost entry is attacker-controlled (rotating it would mint unlimited
  // buckets and defeat the limit). Prefer the single-value x-real-ip the
  // platform sets, then fall back to the RIGHTMOST forwarded hop, never the
  // leftmost.
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    const hops = fwd.split(",");
    return hops[hops.length - 1].trim();
  }
  return "anon";
}

export interface RateLimitResult {
  ok: boolean;
  retryAfter?: number;
}

export function rateLimit(
  req: Request,
  opts: { key: string; limit: number; windowMs: number },
): RateLimitResult {
  const now = Date.now();
  // Opportunistic cleanup so the map cannot grow without bound.
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) if (now > b.reset) buckets.delete(k);
  }
  const id = `${opts.key}:${clientIp(req)}`;
  const b = buckets.get(id);
  if (!b || now > b.reset) {
    buckets.set(id, { count: 1, reset: now + opts.windowMs });
    return { ok: true };
  }
  if (b.count >= opts.limit) return { ok: false, retryAfter: Math.ceil((b.reset - now) / 1000) };
  b.count += 1;
  return { ok: true };
}

/** The 429 response to return when a limit is hit. */
export function tooManyRequests(retryAfter?: number): Response {
  return new Response(JSON.stringify({ error: "Too many requests. Please slow down and try again." }), {
    status: 429,
    headers: {
      "content-type": "application/json",
      ...(retryAfter ? { "retry-after": String(retryAfter) } : {}),
    },
  });
}
