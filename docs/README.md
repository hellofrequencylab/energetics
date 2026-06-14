# Documentation

The map of OneSky's docs. Start here.

## For everyone

- In-app Help Center: `/help` (rendered from `src/lib/help/content.ts`). The
  user-facing guide, systems reference, FAQ, and "what's new."

## For builders and operators

- [`../README.md`](../README.md): project overview and the one idea.
- [`../AGENTS.md`](../AGENTS.md): architecture rules to follow before editing the engine.
- [`../SYSTEMS.md`](../SYSTEMS.md): living roadmap of every system and its status.
- [`RUNBOOK.md`](RUNBOOK.md): configure, deploy, and operate the app.
- [`DESIGN.md`](DESIGN.md): the OneSky design language and site scope.
- [`DESIGN-SYSTEM.md`](DESIGN-SYSTEM.md): the practical UI framework: tokens, the
  uniform width, navigation, and the component primitives. Living reference at
  `/styleguide`.
- [`adr/`](adr/): architecture decision records, newest decisions on top.
- [`../CONTRIBUTING.md`](../CONTRIBUTING.md): how to make a change, and the Definition of Done.
- [`../CHANGELOG.md`](../CHANGELOG.md): the technical change record.

## The rule that keeps these honest

Documentation is part of the change, not a follow-up. When you ship a feature,
fix, or decision, update the docs it touches in the same pull request. The
Definition of Done in CONTRIBUTING.md spells this out.
