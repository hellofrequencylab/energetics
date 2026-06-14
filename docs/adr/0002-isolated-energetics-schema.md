# 0002. Host OneSky in an isolated `energetics` schema

Status: Accepted

## Context

A dedicated Supabase project was not available (free-tier project limit), so
OneSky shares a project with another app. The two must not touch each other's
tables, and OneSky's API config must not disturb the other app's.

## Decision

- Create a dedicated `energetics` Postgres schema. All OneSky tables, policies,
  indexes, and grants live there (`supabase/migrations/0001_init.sql`).
- Point every Supabase client at that schema with `db.schema = "energetics"`,
  through one shared constant (`src/lib/supabase/schema.ts`), so bare
  `.from("birth_events")` calls resolve to `energetics.*`.
- Expose the schema through the dashboard (Settings, Data API, Exposed schemas),
  not by SQL, to avoid overwriting the shared project's PostgREST config.
- Leave the shared project's auth Site URL alone. OneSky requests its own redirect.

## Consequences

- Clean separation inside a shared project. Row level security still scopes every
  row to its owner.
- One required manual dashboard step (expose the schema). It is documented in the
  runbook.
- Moving OneSky to its own project later is straightforward: the schema and
  client config are already self-contained.
