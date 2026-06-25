# Infrastructure registry

The single source of truth for the multi-app topology. If you move an app, add a
schema, change a project, or repoint an env var, update this file in the same pull
request. The runbook (`RUNBOOK.md`) tells you how to operate one app. This tells
you where every app lives and how the apps are kept apart.

A note on names: OneSky's app codename and repo identity stay "energetics" (the
repo directory, the npm package, and the older ADRs use that word). What this
change touches is the database schema OneSky's data lives in: that schema is
renamed from the codename "energetics" to "onesky", so it reads as the product.
Everywhere below, "onesky" is a schema name and "energetics" is the codename and
repo. See ADR-0009 for the decision.

Privacy note: OneSky collects birth data (date, exact time, and place of birth).
That data lives only in the `onesky` schema, scoped to its owner by row level
security, and it never crosses into another app's schema. The same rule holds for
any app added here: an app's data stays in that app's schema.

## The shape of it

These apps belong to one Supabase organization, "Frequency" (Pro plan). The plan
is to keep the flagship Frequency project pure and to gather the smaller apps into
one "Apps Studio" project, each app isolated in its own Postgres schema.

- **Frequency** is the flagship. Its project stays pure: only Frequency's own
  tables. Today it still hosts OneSky's schema and Resonance's `resonance` schema
  as tenants. Both move out, and then Frequency is pure.
- **Apps Studio** is the `hook` project, being restructured to hold several small
  apps side by side. Each app gets one schema. A `shared` schema holds the few
  genuine cross-app commons.

The migration: relocate OneSky (schema `onesky`, renamed from the codename
`energetics` in the move) and then Resonance (schema `resonance`) out of the
Frequency project and into the Studio project, each as an isolated schema. Hook
stays in `public` and is untouched.

## App registry

| App | Supabase project (name / ref) | Schema | Repo | Intended domain | Env vars (which project they point at) | Status |
|---|---|---|---|---|---|---|
| Frequency | Frequency Community / `azsqfeonabsbmemvddqd` | `public` | (Frequency repo) | frequency app domain | Frequency project URL + keys | Flagship. Stays. Goes pure once tenants leave. |
| OneSky (codename energetics) | Frequency Community / `azsqfeonabsbmemvddqd` -> moving to **hook / `qakbtenvporcfkznivdh`** | `onesky` (renamed from `energetics`) | this repo (`energetics`) | `onesky.app` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (set to the hosting project) | Migrating into Apps Studio. Schema renamed to `onesky`. |
| Resonance | Frequency Community / `azsqfeonabsbmemvddqd` -> moving to **hook / `qakbtenvporcfkznivdh`** | `resonance` | (Resonance repo) | resonance app domain | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (set to the hosting project) | Pending. Moves after OneSky. |
| Hook | hook / `qakbtenvporcfkznivdh` | `public` | (Hook repo) | hook app domain | Hook's existing project URL + keys (unchanged) | Live in demo mode (53 tables). Stays in `public`, untouched. |
| shared (commons) | hook / `qakbtenvporcfkznivdh` | `shared` | (managed in Studio) | n/a | n/a (no app deploy of its own) | A schema, not an app. Cross-app commons only. |

Notes on the table:

- The variable **names** are the same across apps. The **values** differ per
  hosting project. Pointing an app at a project is exactly setting those three
  values for that app's deploy. Never put a secret key in a `NEXT_PUBLIC_`
  variable.
- "Demo mode" for Hook is an app-level state in Hook's own code and env. There is
  no `is_demo` flag in the database, so nothing here toggles it.
- OneSky's schema is renamed to `onesky` in the move, matched in the code and the
  migrations (`src/lib/supabase/schema.ts` and `supabase/migrations/`). The
  codename and repo stay "energetics".
- OneSky's 3 existing charts port across with the schema. Birth data moves with it
  and stays owner-scoped.

## Which env vars point where

Each app's Supabase client is configured by the project URL and keys of the
project that hosts it. Pointing an app at a project is exactly setting these for
that app's deploy. The variable **names** are the same across apps. The
**values** differ per hosting project. Never put a secret key in a
`NEXT_PUBLIC_` variable.

| Variable | Holds | Today (OneSky) | After OneSky's move |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL (browser safe) | `https://azsqfeonabsbmemvddqd.supabase.co` | `https://qakbtenvporcfkznivdh.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable anon key (browser safe) | Frequency project's anon key | hook project's anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server only, never `NEXT_PUBLIC_`) | Frequency project's service key | hook project's service key |

The full OneSky env var list (narrative, billing, rate limiting, and the rest)
lives in `RUNBOOK.md`. The three above are the ones that decide which project an
app talks to, so a move is: change these three values, redeploy.

The honest part: because every Studio app shares one project, the anon and service
keys for OneSky, Resonance, and Hook are the **same** project's keys once they
share a project. Isolation between apps is not the key, it is the schema plus row
level security plus grants below.

## Apps Studio isolation conventions

One project, many apps, kept apart by structure rather than by credentials.

### Schema per app

Every app owns exactly one schema named for the app: `public` (Hook, untouched),
`onesky`, `resonance`. All of that app's tables, policies, indexes, and grants
live in its schema. No app puts tables in another app's schema.

### The `shared` schema

A single `shared` schema holds genuine cross-app commons, the things it would be
wrong to duplicate per app. Examples: a unified profile keyed to `auth.users`,
entitlements, a notifications outbox. An app may reference `shared`, but `shared`
never reaches into an app. Keep it small and deliberate: when in doubt, the table
belongs to the app, not to `shared`.

### `db.schema` pinning

Each app's Supabase client pins `db.schema` to that app's schema, so a bare
`.from("birth_events")` resolves inside the app's own schema and a typo cannot
read another app's tables. OneSky already does this through one shared constant,
which the rename sets to `onesky`:

```ts
// src/lib/supabase/schema.ts
export const DB_SCHEMA = "onesky" as const;
```

Auth is unaffected by the pin: it always uses the `auth` schema. A new app sets
its own constant to its own schema name and routes every client through it.

### RLS forced on

Row level security is forced on for every table in every app schema, including
tables only the service role touches. "Forced" means the table owner is subject to
RLS too, so a missing policy fails closed rather than leaking. Every table ships
with policies that scope rows to their owner (`auth.uid()`), or, for server-only
tables, with no client-facing policy at all.

### Per-app grant template

Lock each schema down so only the API roles that need it can use it, and only
through RLS-scoped policies. Apply this once per app schema, substituting the
schema name. It revokes the broad default, grants `usage` on the schema, and grants
table and sequence privileges that RLS then constrains.

```sql
-- Per-app grant template. Replace :app_schema with the app's schema name,
-- e.g. onesky, resonance.

-- 1. Take away the public default so nothing is reachable by accident.
revoke all on schema :app_schema from public;
revoke all on all tables in schema :app_schema from public;

-- 2. Let the API roles enter the schema (PostgREST still needs the schema in
--    Exposed schemas, see below).
grant usage on schema :app_schema to anon, authenticated, service_role;

-- 3. Table privileges. RLS decides which rows each role actually sees.
grant select, insert, update, delete
  on all tables in schema :app_schema to authenticated;
grant select on all tables in schema :app_schema to anon;
grant all on all tables in schema :app_schema to service_role;

-- 4. Sequences, so inserts can allocate ids.
grant usage, select on all sequences in schema :app_schema to authenticated, service_role;

-- 5. Same grants for tables and sequences created later.
alter default privileges in schema :app_schema
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema :app_schema
  grant select on tables to anon;
alter default privileges in schema :app_schema
  grant all on tables to service_role;
alter default privileges in schema :app_schema
  grant usage, select on sequences to authenticated, service_role;

-- 6. RLS is forced on per table in that table's migration, e.g.:
--    alter table :app_schema.<table> enable row level security;
--    alter table :app_schema.<table> force row level security;
```

Tighten further per table: server-only tables (like OneSky's narrative cache) drop
the `anon` and `authenticated` grants entirely and are reached only by the service
role. The grant template is the floor, not a license to expose everything.

### Exposed schemas

PostgREST serves only the schemas listed in the project's Data API "Exposed
schemas". An app's schema is invisible to the API until it is added there, so a
client connects but every table read returns 404 until then. Add each app schema
(`onesky`, `resonance`, and `shared` when an app needs it) alongside `public`.

Do this in the dashboard (Settings, Data API, Exposed schemas), not by SQL, so you
do not clobber the shared project's PostgREST config. Exposing a schema does not
expose its rows: grants and RLS still decide what each role reads.

### No cross-app foreign keys

An app's foreign keys point only inside its own schema, into `shared`, or into
`auth`. No app references another app's tables. This is what lets an app graduate
to its own project cleanly later: cut `shared` and `auth` references at the seam,
and the schema lifts out whole.

## How to add a new app to the Studio

1. **Create the schema.** `create schema <app>;` in the Studio project. Name it for
   the app.
2. **Apply the grant template.** Run the per-app grant template above with the new
   schema name. Force RLS on for every table as you create it.
3. **Pin the app client.** In the app's repo, set its `db.schema` constant to the
   new schema name and route every Supabase client through it (mirror OneSky's
   `src/lib/supabase/schema.ts`). Reference `shared` and `auth` only, never another
   app.
4. **Expose the schema.** Add the schema to the project's Data API Exposed schemas
   in the dashboard, alongside `public`. Without this, reads return 404.
5. **Point the env vars.** Set `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` for the app's
   deploy to the Studio project. Keep the service key server-only.
6. **Register it here.** Add a row to the App registry table and note its repo,
   intended domain, schema, env vars, and status.

## A note on Hook

Hook stays in the `public` schema of the `hook` project, untouched: no schema
migration, demo mode left as-is. Moving Hook into its own `hook` schema is an
optional future step on its own timeline (through its own repo), not planned now.

## The honest ceiling: one login pool

One Supabase project has exactly one `auth.users` table, one set of API roles
(`anon`, `authenticated`, `service_role`), and one JWT secret. So every app in the
Studio project **shares one login pool**. A person who signs in to one Studio app
holds an identity that is valid, at the auth layer, across all of them.

Isolation in the Studio is at the schema, RLS, and grant layer, not at the
credential layer. That is enough to keep one app from reading another app's data.
It is not separate accounts per app: it is one account pool, with each app's data
fenced off by structure.

## Graduating an app to its own project

When an app earns real users and wants its own login pool (or its own quotas,
billing surface, or compliance boundary), graduate it to a dedicated Supabase
project. This is clean precisely because the app is already its own self-contained
schema with no cross-app foreign keys.

Rough steps:

1. **Create the new project** in the Frequency org.
2. **Dump the app's schema** from the Studio project:
   `pg_dump --schema=<app> --no-owner --no-privileges <studio-connection> > <app>.sql`.
   Dump it on its own so nothing else comes along.
3. **Restore into the new project** and re-create the grants (run the grant
   template) and force RLS, since the dump carried structure, not the project's role
   wiring.
4. **Move the users.** The app's rows key to `auth.users` by user id. Migrate the
   relevant auth users into the new project so those ids still resolve. Reconcile
   any `shared` references the app relied on (copy what it needs into the new
   project, or keep a deliberate seam).
5. **Expose the schema** in the new project's Data API Exposed schemas.
6. **Repoint the env vars** for the app's deploy to the new project URL and keys,
   then redeploy.
7. **Drop the old schema** from the Studio project once the cutover is verified,
   and update this registry: new project name and ref, same schema name.

This is the same move OneSky is making now, in the reverse direction of
consolidation: a self-contained schema lifts out whole because nothing else depends
on its internals.
