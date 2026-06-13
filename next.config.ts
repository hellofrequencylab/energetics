import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `sweph` is a native (N-API) Swiss Ephemeris binding. It must stay external to
  // the server bundle so its `.node` binary is loaded at runtime instead of being
  // traced/bundled by Turbopack/webpack. Astro calculations therefore only run in
  // the Node.js runtime (never the Edge runtime).
  serverExternalPackages: ["sweph"],
};

export default nextConfig;
