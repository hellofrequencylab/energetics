# Runbook: move Resonance into the Studio project

This is the step-by-step to relocate Resonance (a social DJ app) out of the
Frequency project and into the hook / Apps Studio project, as an isolated
`resonance` schema. Resonance lives in Frequency today as the `resonance` schema,
and it keeps that name on arrival, so its code and migrations do not change. The
move re-homes the schema, repoints the env vars, verifies, and only then removes
Resonance from Frequency.

Resonance moves after OneSky, by the same playbook. For the why, see
`docs/adr/0009-apps-studio-multi-app-isolation.md`. For where everything lives, see
`docs/INFRA.md`. For the OneSky move this one mirrors, see
`docs/runbooks/onesky-relocation.md`.

This runbook is driven from the Resonance repo, not this one (OneSky / codename
energetics). The SQL and env changes here run against Supabase projects and the
Resonance deploy. Nothing here edits OneSky's code or its `onesky` schema.

Privacy note: if Resonance stores any personal data (account email, listening
history, social connections, or anything a person enters), that data lives in the
`resonance` schema, scoped to its owner by row level security. This move keeps it in
the `resonance` schema the whole way: it never lands in another app's schema, and it
stays owner-scoped on both sides. Confirm the Resonance repo's own privacy notice
still reads true once the app points at the hook project.

## Projects in play

| Role | Name | Project ref | What it holds |
|---|---|---|---|
| Source (leaving) | Frequency Community | `azsqfeonabsbmemvddqd` | Resonance's `resonance` schema, moving out. |
| Target (arriving) | hook / Apps Studio | `qakbtenvporcfkznivdh` | Resonance lands here as the `resonance` schema. |

The honest part: the Studio project has one `auth.users` table and one set of API
keys, shared by every app in it. After this move, Resonance uses the hook project's
keys, the same keys Hook and OneSky use. A person who signs in is one identity
across Hook, OneSky, and Resonance. Isolation between apps is the schema plus RLS
plus locked-down grants, not the keys. See the ADR for the full reasoning, and treat
Resonance's users as Studio-wide identities until the app graduates to its own
project.

## Before you start

- You can run SQL against both projects (dashboard SQL editor, or `psql` with each
  project's connection string).
- You have a working checkout of the Resonance repo, with its migrations and the
  ability to run them against a target project (path A), or `pg_dump`/`psql` access
  to both projects (path B).
- You have the hook project's API keys to hand for the cutover:
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and
  `SUPABASE_SERVICE_ROLE_KEY` (server only, never a `NEXT_PUBLIC_` variable).
- You can edit the Resonance deploy's environment variables.
- Never use a secret key in a `NEXT_PUBLIC_` variable, on either project, at any
  step.

Do the phases in order. Do not run the decommission SQL in phase 4 until phase 3
passes against the hook project.

## Phase 0: clear the naming collision first (Frequency repo)

Read this before you move anything. The word "resonance" means two different things
in the Frequency project, and the move is cleaner if you separate them first.

- The **DJ app** is the `resonance` schema. That is what this runbook moves.
- The Frequency project's **`public` schema** has `resonance_*` tables that belong
  to a different feature, member matching inside Frequency. They are not the DJ app.
  They stay in Frequency.

These two never had a real relationship, they just share a word. Leaving the name
ambiguous risks someone later reading `public.resonance_*` as "the DJ app's leftover
tables" and dropping or moving them by mistake. To remove that risk, rename the
member-matching tables in Frequency so "resonance" means only the DJ app.

- This is a **Frequency-repo task**, owned by Frequency, done through a Frequency
  migration and reviewed there. Pick a name that says what the feature is (for
  example `member_match_*` or `matching_*`), not a name that still reads as the DJ
  app.
- **Do not** run a blind `alter table` against the live Frequency database from
  here. A rename moves with application code that reads those tables, so it goes
  through the Frequency repo's migration and deploy, not an ad hoc SQL session. Flag
  it to the Frequency owner and let them sequence it.
- This cleanup is not a hard blocker for phases 1 through 4, because the DJ app's
  data is in the `resonance` schema and the member-matching tables are in `public`:
  the move below never touches `public`. But do it close to this move so the two
  meanings do not stay tangled, and so phase 4's `drop schema "resonance"` is
  obviously the DJ app and obviously not the member-matching tables.

## Phase 1: build the schema in the Studio project

Stand up the `resonance` schema in the hook project. Two paths. Path A is preferred
because it rebuilds the schema from the Resonance repo's own migrations, the same
way the app defines it, so structure, RLS, and grants match the repo exactly. Path B
preserves existing data by dumping and restoring the schema. Pick one.

### Path A: re-run the Resonance migrations against the hook project (preferred)

Drive this from the Resonance repo. It recreates the schema's structure on the new
project from the source of truth, the migrations themselves.

1. **Point the Resonance migration tooling at the hook project.** Use the hook
   project's connection string (`qakbtenvporcfkznivdh`) as the target. Do not point
   it at Frequency. Keep the service-role connection string out of shell history and
   out of any `NEXT_PUBLIC_` variable.
2. **Run the Resonance migrations in order** against the hook project, exactly as the
   Resonance repo documents. They create the `resonance` schema, its tables, RLS
   policies, indexes, and grants to the API roles. If any migration provisions an
   extension (for example in `public`), let it run on this project too, the same as
   it did on Frequency.
3. **Confirm the structure** exists with RLS enabled and no rows yet (path A does not
   carry data):

   ```sql
   -- Run against qakbtenvporcfkznivdh.
   select table_name
   from information_schema.tables
   where table_schema = 'resonance'
   order by table_name;
   -- Expect the Resonance app's full table set, matching the repo's migrations.

   -- Spot check that RLS is on for every resonance table.
   select relname, relrowsecurity
   from pg_class c
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'resonance' and c.relkind = 'r'
   order by relname;
   -- Expect relrowsecurity = true for every row.
   ```

   If the app has seed or reference data that lives in migrations, path A already
   loaded it. If it has user data you need to keep, use path B instead (or follow
   path A with the data-only portion of path B).

### Path B: pg_dump the schema from Frequency and restore into the hook project

Use this when you need to preserve existing Resonance data, not just structure. It
moves only the `resonance` schema, never another app's, and never `public`.

```bash
# Dump ONLY the resonance schema from Frequency (structure + data, no owners/grants).
pg_dump \
  --schema=resonance \
  --no-owner --no-privileges \
  "$FREQUENCY_CONNECTION_STRING" \
  > resonance-schema.sql

# Restore into the Studio project. This creates the resonance schema and its
# tables, then loads the rows. It does not touch Hook's public schema.
psql "$HOOK_CONNECTION_STRING" < resonance-schema.sql
```

Then re-assert the locked-down grants the Studio model requires, because the dump
ran with `--no-privileges`. Grant the API roles rights on the `resonance` schema
only, matching how the Resonance repo's migrations grant them (the same grants path A
would have applied). Do not grant `resonance` rights to anything outside its own
schema, and do not widen any other schema's grants.

Identity caveat (same as the OneSky move): `auth.users` is per project. If
Resonance's tables carry a `user_id` that references `auth.users`, those ids come
from Frequency and do not exist in the hook project yet. Recreate the owning
accounts in the hook project (Dashboard, Authentication, Users, or have users sign
in once after cutover), capture the old-id to new-id mapping, and rewrite `user_id`
on the loaded rows before you rely on RLS. Verify nothing is left pointing at a
missing user:

```sql
-- Run against qakbtenvporcfkznivdh, per table that references auth.users.
select count(*) from resonance.<table> t
  left join auth.users u on u.id = t.user_id
  where t.user_id is not null and u.id is null;  -- expect 0
```

If Resonance has no real users yet (pre-launch), path A is simpler: rebuild the
structure and skip the identity rewrite entirely.

Do not expose the schema to the Data API yet. Exposing happens at cutover (phase 2)
so the app does not start serving from a half-loaded schema.

## Phase 2: cutover

Point Resonance at the hook project and expose the schema, so the running app reads
and writes the Studio project from now on.

1. **Repoint the env vars** to the hook project, in the Resonance deploy
   (Production and Preview) and in any local `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://qakbtenvporcfkznivdh.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = the hook project's anon (publishable) key
   - `SUPABASE_SERVICE_ROLE_KEY` = the hook project's service role key (server only)

   Leave every other Resonance variable as it is. Those three are the ones that
   decide which project the app talks to. The variable names are the same as before,
   only the values change.
2. **Expose the schema.** In the hook project's dashboard (Settings, Data API,
   Exposed schemas), add `resonance` alongside `public` (and `onesky`, once it is
   there). Without this, the app connects but every table read returns a 404 from
   PostgREST. Do this in the dashboard, not by SQL, so you do not clobber the
   project's PostgREST config.
3. **Set the auth redirect URLs** on the hook project (Authentication, URL
   Configuration), adding Resonance's origins to Redirect URLs, and enable whatever
   auth providers Resonance uses. Leave the project Site URL as it is. Each app
   requests its own redirect, so it does not depend on the project Site URL.
4. **Redeploy** Resonance so the new env vars take effect.

## Phase 3: verify

Run the verification checklist at the end of this runbook before going further. The
gate is simple: do not touch phase 4 until every item passes against the hook
project.

## Phase 4: decommission Resonance from Frequency (GATED)

Only after phase 3 passes. This removes Resonance from the Frequency project. With
OneSky already gone, dropping the `resonance` schema is the step that finally leaves
Frequency pure (its own data only). It is destructive and hard to reverse.

**Back up first.** Dump the schema (structure and data) from Frequency before you
drop anything, and keep the file somewhere safe until you are certain the move
stuck:

```bash
pg_dump --schema=resonance --no-owner --no-privileges \
  "$FREQUENCY_CONNECTION_STRING" > resonance-frequency-backup.sql
```

```sql
-- ============================================================================
-- DO NOT RUN UNTIL VERIFIED.
-- Run this ONLY against the SOURCE project, Frequency Community
-- (azsqfeonabsbmemvddqd), and ONLY after phase 3 verification passes on the
-- hook project AND the backup above exists. This permanently removes the
-- Resonance DJ app from Frequency. It does not touch the hook project.
--
-- This drops the `resonance` SCHEMA (the DJ app). It does NOT touch the
-- `public.resonance_*` member-matching tables, which are a different feature
-- and stay in Frequency. See phase 0. Confirm you are dropping the schema, not
-- those tables, before you run this.
-- ============================================================================
drop schema "resonance" cascade;
```

After the drop, update `docs/INFRA.md`: change Resonance's row so its project is
hook / `qakbtenvporcfkznivdh`, mark it moved, and note that Frequency no longer hosts
the `resonance` schema and is now pure (both tenants out). Add a `CHANGELOG.md` line.
If the phase 0 rename has landed in the Frequency repo, note that too, so the only
"resonance" left in Frequency is the renamed member-matching feature.

## Verification checklist (cutover verification)

Run this after phase 2, against the hook project (`qakbtenvporcfkznivdh`). This is
the cutover-verification gate for phase 4.

1. **Schema is present and isolated.** The `resonance` schema exists with its full
   table set and RLS on for every table (the spot check in phase 1). Hook's `public`
   schema is unchanged (same table count as before, demo mode untouched).
2. **Build and tests.** The Resonance repo's typecheck and test suite pass against
   the new configuration, per the Resonance repo's own checks.
3. **Load the app.** Open the redeployed Resonance. It renders and you can sign in.
   A sign in that fails on the auth callback means the redirect URLs or env vars are
   wrong: recheck phase 2.
4. **Exercise a write.** Do one real action that writes to the `resonance` schema
   (the app's primary create flow), then confirm the row landed in the new project:

   ```sql
   -- Run against qakbtenvporcfkznivdh.
   select * from resonance.<primary_table> order by created_at desc limit 5;
   ```

5. **No 404 from PostgREST.** Table reads over the Data API succeed (the app's lists
   load, no "table not found" in the network tab). A 404 means `resonance` is not in
   the hook project's Exposed schemas: redo phase 2, step 2.
6. **Cross-app isolation holds.** From a Resonance session, a bare query cannot reach
   another app's tables: the client is pinned to `db.schema = "resonance"`, RLS is
   forced on, and grants are scoped to the `resonance` schema only. Spot check that
   Resonance's API role has no rights on `onesky` or Hook's `public`.

When all six pass, phase 4 is unblocked. Until then, Resonance still has a clean home
in Frequency, so there is no rush and no risk in waiting.
