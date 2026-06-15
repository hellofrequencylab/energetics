import { describe, it, expect } from "vitest";
import { rateLimitShared } from "./rate-limit";

function req(ip: string): Request {
  return new Request("https://onesky.app/api/charts/narrate", {
    method: "POST",
    headers: { "x-real-ip": ip },
  });
}

describe("rateLimitShared (falls back to in-memory without Upstash)", () => {
  it("allows up to the limit, then blocks with a retryAfter", async () => {
    const opts = { key: "test-ai", limit: 3, windowMs: 60_000 };
    const ip = "203.0.113.7";
    const results = [];
    for (let i = 0; i < 4; i++) results.push(await rateLimitShared(req(ip), opts));
    expect(results.slice(0, 3).every((r) => r.ok)).toBe(true);
    expect(results[3].ok).toBe(false);
    expect(results[3].retryAfter).toBeGreaterThan(0);
  });

  it("keeps separate buckets per client IP", async () => {
    const opts = { key: "test-ai-2", limit: 1, windowMs: 60_000 };
    expect((await rateLimitShared(req("198.51.100.1"), opts)).ok).toBe(true);
    expect((await rateLimitShared(req("198.51.100.2"), opts)).ok).toBe(true);
    expect((await rateLimitShared(req("198.51.100.1"), opts)).ok).toBe(false);
  });
});
