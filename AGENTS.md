<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Energetics — architecture rules (read before editing `src/lib`)

This is a multi-system birth-chart **synthesis engine**. See `README.md` for the
full picture. The non-negotiable invariants:

1. **Engines are pure.** `src/lib/systems/<id>/engine.ts` `compute(birth, {ephemeris})`
   is deterministic — no I/O, randomness, clock reads, or network.
2. **No engine imports another engine.** The registry (`src/lib/core/registry.ts`)
   is the only coupling point.
3. **The ephemeris is a shared utility** (`src/lib/core/ephemeris`), never a system.
4. **Native math stays native.** Mapping to the ontology happens in the separate
   `adapter.ts`, never inside the engine.
5. **Synthesis is deterministic** (`src/lib/synthesis`): a graph of weighted
   convergences + tensions, ranked by independent-source-group count. **No blended
   score. No embeddings/LLM in structural synthesis** — the LLM `narrative.ts` is a
   prose layer that READS the synthesis and never computes it.
6. **Provenance is first-class**; **lineage is labeled, not laundered.**

Adding a system = a folder under `src/lib/systems/<id>` (engine + adapter + index)
+ one line in the registry. Run `npm run test && npm run typecheck` before pushing.
