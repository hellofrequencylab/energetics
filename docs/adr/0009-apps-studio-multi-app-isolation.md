# 0009. Apps Studio: one project, many apps, isolated by schema

Status: Accepted

## Context

We run four apps in one Supabase organization ("Frequency", on the Pro plan):

- **Frequency** (the flagship, project "Frequency Community", ref
  `azsqfeonabsbmemvddqd`) is the public community app.
- **Hook** (project "hook", ref `qakbtenvporcfkznivdh`) is in demo mode with a
  handful of mostly test users, living in its `public` schema (53 tables).
- **OneSky** (this app, codename "energetics") is pre-launch.
- **Resonance** is pre-launch.

For historical reasons (ADR-0002, written when a dedicated project was not
available), the Frequency project also hosts OneSky's schema and Resonance's
`resonance` schema. We want Frequency to be pure (its own data only), and we do
not want to pay for a separate Supabase project per app while OneSky and Resonance
have no real users. A project is a billable unit. Spinning up one per pre-launch
app multiplies cost for no benefit, since the cost lives in active usage, not in
keeping a schema warm.

So we need a home for the pre-launch apps that is cheap, keeps each app's tables
out of every other app's reach, and does not entangle them with the flagship's
login or data.

A note on names: the app's codename and repo identity stay "energetics" (the repo
directory, the npm package, and the older ADRs use that word). What changes here is
the database schema OneSky's data lives in. We rename that schema from the codename
"energetics" to "onesky" as part of the move, so the schema reads as the product,
not the codename. The codename is not changing.

## Decision

**Restructure the "hook" project into a multi-app "Apps Studio": one schema per
app inside one project, plus a `shared` schema for genuine cross-app commons.**

Move OneSky out of the Frequency project and into the Studio project as an isolated
schema, and rename that schema from the codename `energetics` to `onesky` in the
same move. Then do the same for Resonance (schema `resonance`) later. Hook stays in
`public` for now and is untouched: no schema migration, demo mode left as-is.
Isolating Hook into its own `hook` schema is an optional future step through its own
repo, not part of this decision. Once OneSky and Resonance are out, remove their
schemas from Frequency so it is pure.

Two rules decide where a thing lives:

1. **A project is an identity boundary.** It owns one `auth.users` table, one set
   of API roles (`anon`/`authenticated`/`service_role`), and one JWT secret. Apps
   that must not share a login pool belong in different projects. That is why the
   flagship Frequency stays its own project and is left pure.
2. **A schema is an app.** Each app gets one Postgres schema that holds all of its
   tables, policies, indexes, and grants. Apps in the Studio project share the
   identity boundary but are otherwise sealed off from each other at the schema and
   row level security layer.

The isolation model applies to the apps in the Studio project (Hook's live `public`
schema is left as-is until it opts in):

- **One schema per app:** `public` (Hook, untouched for now), `onesky` (OneSky),
  `resonance` (Resonance), plus a `shared` schema for true cross-app commons (for
  example a unified profile keyed to `auth.users`, entitlements, and a notifications
  outbox).
- **Each client pins its schema.** Every app's Supabase client sets `db.schema`
  to its own schema, so a bare `.from()` cannot reach another app's tables. OneSky
  already does this through one constant (`src/lib/supabase/schema.ts`), which the
  rename sets to `DB_SCHEMA = "onesky"`.
- **RLS is forced on for every table**, so a row is scoped to its owner even if a
  query crosses a schema.
- **Grants are locked down per schema.** An app's API roles get rights on that
  app's schema only.
- **PostgREST exposed schemas** control what is served over the Data API. Adding a
  schema there is a deliberate dashboard step, not a side effect.
- **No cross-app foreign keys** except into `shared` or `auth`. Apps reference
  common identity and commons, never each other's private tables.

Birth data stays inside the `onesky` schema and is governed by that app's RLS: each
row is scoped to the person who entered it, and no other app in the Studio project
can read it.

## The honest ceiling

This buys isolation at the schema and RLS layer, not at the credential layer. One
project has exactly one `auth.users` table, one set of API roles, and one JWT
secret, so **every app in the Studio project shares one login pool.** A person who
signs in is one identity across Hook, OneSky, and Resonance. Schema pinning plus
forced RLS plus locked-down grants keep each app's data sealed, but they do not
give each app its own users or its own keys. We are naming this on purpose so no
one later mistakes schema isolation for credential isolation.

## Consequences

- **Cost stays flat** while OneSky and Resonance are pre-launch: one Pro project
  carries several schemas instead of several billable projects.
- **Frequency becomes pure.** After the move, its only data is its own. The
  flagship never shares a login pool or a database with experiments.
- **Hook is unaffected.** It keeps running in `public` in demo mode through this
  change. Its move into a `hook` schema is a later, optional step it can take on its
  own timeline, not a dependency of this one.
- **A graduation path is built in.** When an app earns real users and wants its
  own login pool, keys, and blast radius, it moves to a dedicated project. The move
  is clean because the app is already a self-contained schema with a pinned client,
  the same property that made the OneSky-out-of-Frequency move in this ADR
  straightforward (ADR-0002 anticipated it).
- **Cross-app coupling has one shape:** references go into `shared` or `auth`, and
  nowhere else. The `shared` schema is the only sanctioned coupling point, which
  keeps the graduation path open (an app depends on commons, not on a sibling).
- **One manual dashboard step per app** (expose the schema to the Data API,
  per ADR-0002 and the runbook). Documented, not automated, so it does not clobber
  the project's PostgREST config.
- **The rename touches the schema, not the codename.** Code that pins `db.schema`,
  the migrations, and the ops docs move to `onesky`; the repo, package, and codename
  stay "energetics". OneSky's 3 existing charts are ported in the move.
- **The shared login pool is a known limit, not a surprise.** Until an app
  graduates, treat its users as Studio-wide identities and design RLS accordingly.

## Alternatives rejected

- **A project per app.** Gives each app its own login pool and keys, which is the
  real isolation we eventually want, but it bills per project. Paying for four
  projects to host two pre-launch apps with no users is the cost we are avoiding.
  This is exactly the graduation path, deferred until an app earns it.
- **Merge everything into Frequency's `public` schema.** One pile of tables for
  every app couples their data and migrations, and puts experiments in the
  flagship's login pool and database. It is the opposite of the boundary we want:
  Frequency should be pure, not a landlord.
- **Leave OneSky and Resonance in the Frequency project as schemas (the status
  quo from ADR-0002).** Isolation is fine, but the apps still live inside the
  flagship's identity boundary and keep Frequency impure. Moving them to the Studio
  project keeps the schema isolation and gets the experiments out of the flagship.
