# Contributing to OneSky

## Before you edit the engine

Read [`AGENTS.md`](AGENTS.md). The architecture invariants there are not style
preferences. Breaking them (an engine importing another engine, a blended score,
a language model inside the structural synthesis) is a defect.

## Voice and copy rules

All user-facing copy follows [`docs/DESIGN.md`](docs/DESIGN.md):

- No em dashes anywhere. Use a period, a comma, a colon, parentheses, or "and."
- Active voice, sentence case, plain verbs. A control says what it does.
- State privacy plainly wherever birth data is collected.

## Workflow

1. Branch from `main`.
2. Make the change.
3. Run `npm run typecheck`, `npm run lint`, and `npm run test`. All must pass.
4. Open a pull request. Let Vercel build the preview.
5. Merge to `main`. Vercel promotes production.

## Definition of Done

A change is done only when:

- [ ] Types, lint, and tests pass.
- [ ] New behavior has a test (engine output, synthesis shape, or route).
- [ ] Docs that the change touches are updated in the same pull request:
  - [ ] In-app Help Center (`src/lib/help/content.ts`) if it changes what users
        see or do, including a "what's new" entry for anything user visible.
  - [ ] [`CHANGELOG.md`](CHANGELOG.md) for the technical record.
  - [ ] [`docs/RUNBOOK.md`](docs/RUNBOOK.md) if it changes config, deploy, or ops.
  - [ ] [`SYSTEMS.md`](SYSTEMS.md) if it adds or advances a system.
  - [ ] A new ADR in [`docs/adr/`](docs/adr/) for a significant or hard-to-reverse
        decision.
- [ ] Privacy and lineage are honored: birth data stays owner-scoped, and any new
      tradition is labeled by lineage.

This is what "documented, and written to as we go" means in practice: the docs and
the help desk grow with the product, in the same commits.
