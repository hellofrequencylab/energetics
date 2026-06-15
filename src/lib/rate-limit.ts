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

/**
 * Distributed rate limit for the costly AI routes, backed by Upstash Redis when
 * configured (`UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`) so the limit
 * holds across serverless instances instead of resetting per cold start. Falls
 * back to the in-memory limiter when Upstash is absent or errors, so a
 * misconfiguration or outage never blocks legitimate use (fail-open to local).
 */
export async function rateLimitShared(
  req: Request,
  opts: { key: string; limit: number; windowMs: number },
): Promise<RateLimitResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return rateLimit(req, opts);

  const id = `rl:${opts.key}:${clientIp(req)}`;
  try {
    // One round trip: INCR the counter and set the window TTL only on the first
    // hit (PEXPIRE ... NX). The pipeline returns the post-increment count first.
    const res = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify([
        ["INCR", id],
        ["PEXPIRE", id, String(opts.windowMs), "NX"],
      ]),
      cache: "no-store",
    });
    if (!res.ok) return rateLimit(req, opts);
    const out = (await res.json()) as { result: unknown }[];
    const count = Number(out?.[0]?.result);
    if (!Number.isFinite(count) || count <= 0) return rateLimit(req, opts);
    if (count > opts.limit) return { ok: false, retryAfter: Math.ceil(opts.windowMs / 1000) };
    return { ok: true };
  } catch {
    return rateLimit(req, opts);
  }
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
