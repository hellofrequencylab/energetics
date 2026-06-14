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

# Documentation contract (write to the docs as we go)

Documentation is part of every change, not a follow-up. Update the docs a change
touches in the same pull request. See `CONTRIBUTING.md` for the full Definition of
Done. The map of docs is in `docs/README.md`.

- User-facing change: update the in-app Help Center (`src/lib/help/content.ts`),
  including a "what's new" entry for anything a user can see.
- Any notable change: add a `CHANGELOG.md` line.
- Config, deploy, or ops change: update `docs/RUNBOOK.md`.
- New or advanced system: update `SYSTEMS.md`.
- Significant or hard-to-reverse decision: add an ADR in `docs/adr/`.

# Copy and voice (all user-facing text)

Follow `docs/DESIGN.md`. The two hard rules: (1) no em dashes anywhere, use a
period, comma, colon, parentheses, or "and"; (2) write from the user's side of the
screen, in active voice and sentence case, naming things by what the person
controls. State privacy plainly wherever birth data is collected.
