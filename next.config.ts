import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `sweph` is a native (N-API) Swiss Ephemeris binding. It must stay external to
  // the server bundle so its `.node` binary is loaded at runtime instead of being
  // traced/bundled by Turbopack/webpack. Astro calculations therefore only run in
  // the Node.js runtime (never the Edge runtime).
  serverExternalPackages: ["sweph"],

  // `sweph` resolves its prebuilt binary dynamically via node-gyp-build
  // (`prebuilds/<platform>-<arch>/sweph.node`), which the serverless file tracer
  // can't follow statically — so the .node binary would be missing from the
  // deployed function and the top-level import would crash it (HTML 500 instead
  // of JSON). Force the prebuilds into every server function's bundle.
  outputFileTracingIncludes: {
    "/*": ["node_modules/sweph/prebuilds/**"],
  },
};

export default nextConfig;
