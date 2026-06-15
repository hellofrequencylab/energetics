import { describe, it, expect } from "vitest";
import { isCrossSiteMutation } from "./csrf";

function req(method: string, headers: Record<string, string>): Request {
  return new Request("https://onesky.app/api/profile", { method, headers });
}

describe("isCrossSiteMutation", () => {
  it("never blocks safe methods", () => {
    expect(isCrossSiteMutation(req("GET", { "sec-fetch-site": "cross-site" }))).toBe(false);
    expect(isCrossSiteMutation(req("HEAD", { "sec-fetch-site": "cross-site" }))).toBe(false);
  });

  it("blocks a cross-site mutation via Sec-Fetch-Site", () => {
    expect(isCrossSiteMutation(req("POST", { "sec-fetch-site": "cross-site" }))).toBe(true);
    expect(isCrossSiteMutation(req("DELETE", { "sec-fetch-site": "cross-site" }))).toBe(true);
  });

  it("allows same-origin and same-site mutations", () => {
    expect(isCrossSiteMutation(req("POST", { "sec-fetch-site": "same-origin" }))).toBe(false);
    expect(isCrossSiteMutation(req("POST", { "sec-fetch-site": "same-site" }))).toBe(false);
    expect(isCrossSiteMutation(req("POST", { "sec-fetch-site": "none" }))).toBe(false);
  });

  it("falls back to Origin vs Host when Sec-Fetch-Site is absent", () => {
    expect(isCrossSiteMutation(req("POST", { origin: "https://evil.test", host: "onesky.app" }))).toBe(true);
    expect(isCrossSiteMutation(req("POST", { origin: "https://onesky.app", host: "onesky.app" }))).toBe(false);
  });

  it("allows requests with no browser signal at all (non-browser clients)", () => {
    expect(isCrossSiteMutation(req("POST", { host: "onesky.app" }))).toBe(false);
  });

  it("treats a malformed Origin as cross-site", () => {
    expect(isCrossSiteMutation(req("POST", { origin: "not-a-url", host: "onesky.app" }))).toBe(true);
  });
});
