# 0001. Pure isolated engines, deterministic synthesis

Status: Accepted

## Context

OneSky reads a birth moment through many divinatory traditions and then shows
where they agree. If engines could see each other, or if a language model scored
the result, the output would be impossible to trust or reproduce: agreement could
be manufactured, and provenance would be lost.

## Decision

- The sky is computed once as shared infrastructure (`src/lib/core/ephemeris`),
  never as a system.
- Each system is a pure engine: `compute(birth, {ephemeris})` is deterministic,
  with no input or output, no randomness, no clock, no network.
- No engine imports another engine. The registry
  (`src/lib/core/registry.ts`) is the only coupling point.
- Native math stays in the engine. Mapping to the shared ontology happens in a
  separate adapter.
- Synthesis (`src/lib/synthesis`) is deterministic: a graph of weighted
  convergences and declared tensions, ranked by how many independent source
  groups agree. No blended score. No embeddings or language model in the
  structural synthesis.
- The narrative layer reads the finished synthesis and writes prose. It never
  computes the synthesis.
- Provenance is first class. Lineage is labeled, not laundered.

## Consequences

- Output is reproducible and fully attributable.
- Adding a system is local: a folder under `src/lib/systems/<id>` plus one line
  in the registry.
- The language model can never invent structure, only describe it.
- Tests can pin engine output and synthesis shape with golden cases.
