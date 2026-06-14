# 0004. Bundle the sweph native binary into serverless functions

Status: Accepted

## Context

Chart compute failed on Vercel with "Unexpected token '<' ... is not valid JSON."
The `/api/charts/compute` function imports the native Swiss Ephemeris (`sweph`) at
module load. `sweph` resolves its prebuilt binary dynamically through
`node-gyp-build` (`prebuilds/<platform>-<arch>/sweph.node`). Vercel's file tracer
cannot follow that runtime path, so the binary was missing from the deployed
function. The import threw at startup, before the route's try/catch, and Vercel
served a generic HTML error page that the UI could not parse as JSON.

## Decision

Force-include the prebuilt binaries in every server function with
`outputFileTracingIncludes` in `next.config.ts`:

```ts
outputFileTracingIncludes: {
  "/*": ["node_modules/sweph/prebuilds/**"],
},
```

Keep `serverExternalPackages: ["sweph"]` so the binary is loaded at runtime rather
than bundled by the compiler.

## Consequences

- The `linux-x64` and `linux-arm64` binaries ship with the functions, verified in
  the route's `.nft.json` trace.
- Native compute runs on the Node runtime, never the Edge runtime.
- A small size cost per function (a few binaries), well within limits.
