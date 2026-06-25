-- Apps Studio foundation (run once, hook/Studio project ref qakbtenvporcfkznivdh)
--
-- This file sets up the shared backbone of the multi-app "Apps Studio" model:
-- one schema per app plus a "shared" schema for genuine cross-app commons. The
-- schema map for this project is:
--   * public     → Hook (already live here, 53 tables, demo mode). UNTOUCHED.
--   * onesky     → OneSky (incoming, via OneSky's own migrations).
--   * resonance  → Resonance (incoming later, via its own migrations).
--   * shared     → genuine cross-app commons (created by this file).
-- OneSky's codename is "energetics" (the repo, the npm package, and older ADRs use
-- that word), but its Postgres SCHEMA is "onesky". Isolation is at the schema + RLS
-- layer: every app's Supabase client pins db.schema (OneSky does this in
-- src/lib/supabase/schema.ts), so a bare .from() cannot reach another app's tables.
-- See docs/adr/0002-isolated-energetics-schema.md.
--
-- NON-DESTRUCTIVE: this file only adds a "shared" schema and its grants. It does
-- NOT touch the existing "public" schema, where the Hook app lives (53 tables,
-- demo mode), and it does NOT touch Hook data. Hook stays in "public" as-is: no
-- schema migration, demo mode left alone. The schema isolation in this change
-- applies only to the NEW incoming apps (OneSky, then Resonance).
--
-- The honest ceiling: one Supabase project has exactly one auth.users table and
-- one set of API roles (anon, authenticated, service_role) and one JWT secret. So
-- every Studio app SHARES ONE LOGIN POOL. Isolation is per schema + RLS, not per
-- credential. The escape hatch is graduating an app to its own project once it
-- earns real users (clean, because it is already its own schema).
--
-- This is safe to re-run: every statement is idempotent ("if not exists", and
-- grants/default privileges that simply reassert the same state).

-- The "shared" schema: genuine cross-app commons only --------------------------
-- Put a thing here only when more than one app legitimately needs it (a unified
-- profile keyed to auth.users, entitlements, a notifications outbox). App-specific
-- tables never belong here. Cross-app foreign keys are allowed only INTO "shared"
-- or "auth", never app-to-app.
create schema if not exists shared;

-- Per-app grant / isolation template (shown applied to "shared") ---------------
--
-- This block is the REUSABLE template every NEW app schema follows. Copy it into
-- the owning app's own migrations, replacing "shared" with the app schema name
-- (onesky, resonance), and adjust who may reach the schema:
--   * "shared" is reachable by authenticated and service_role.
--   * an app schema is reachable only by the roles that app needs.
-- Note this template does NOT grant to anon: Studio app data sits behind a real
-- login. (OneSky's own 0001_init.sql additionally grants onesky to anon for its
-- guest sign-in flow; that is the app's choice, made in its own migrations.)
--
-- The mirror of grants here and in OneSky's migrations: usage on the schema lets a
-- role reach objects, table-level RLS still gates every row.

-- 1. Let the right API roles reach objects in the schema (RLS still gates rows).
grant usage on schema shared to authenticated, service_role;

-- 2. Future tables created in this schema grant the right privileges
--    automatically. authenticated gets row-level CRUD (RLS narrows it to the
--    caller's own rows); service_role gets full access for trusted server work.
alter default privileges in schema shared
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema shared
  grant all on tables to service_role;

-- 3. Future sequences (identity columns, etc.) usable by the same roles.
alter default privileges in schema shared
  grant usage, select on sequences to authenticated;
alter default privileges in schema shared
  grant all on sequences to service_role;

-- 4. Any tables that already exist in the schema (none on first run) get the
--    same grants, so a re-run after tables are added stays consistent.
grant select, insert, update, delete on all tables in schema shared to authenticated;
grant all on all tables in schema shared to service_role;
grant usage, select on all sequences in schema shared to authenticated;
grant all on all sequences in schema shared to service_role;

-- DENY BY DEFAULT: every table in "shared" (and in every app schema) MUST enable
-- row level security in the owning app's own migrations, with explicit policies.
-- Grants above only open the door to the schema; without RLS plus a policy, a
-- table is closed to authenticated. This file creates no tables, so it enables no
-- RLS. The app that adds a table owns its RLS.

-- OneSky (schema "onesky") is applied SEPARATELY --------------------------------
-- This file does NOT create or recreate the "onesky" schema. OneSky's own
-- migrations in supabase/migrations/ (0001_init.sql through 0011) create the
-- "onesky" schema, its tables, RLS policies, indexes, and grants, and seed its
-- data. Apply those migrations against this project on their own. They are
-- self-contained and already follow the template above (each table enables RLS and
-- scopes rows to their owner). Privacy note: OneSky's birth data (names, dates,
-- times, places) lives in onesky.birth_events and is scoped to the owning user by
-- RLS, never shared across apps. Resonance (schema "resonance") lands the same way
-- later, through its own migrations.

-- REMINDER: expose schemas to PostgREST in the dashboard ------------------------
-- A schema is served over the Data API only after it is listed in the project's
-- Exposed schemas. After applying this file and OneSky's migrations, add "onesky"
-- to Settings, Data API, Exposed schemas (and later "resonance"). Do this in the
-- dashboard, not by SQL, so you do not clobber the project's PostgREST config.
-- Without it, the app connects but every table read returns a 404 from PostgREST.
-- "public" (Hook) stays exposed and untouched: do not remove it. Leave "shared"
-- exposed only if an app reads it over the Data API. The auth roles, JWT secret,
-- and Site URL are project-wide: leave them as they are.
