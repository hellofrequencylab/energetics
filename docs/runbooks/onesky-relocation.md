# Runbook: move OneSky into the Studio project

This is the step-by-step to relocate OneSky out of the Frequency project and into
the hook / Apps Studio project. OneSky's data lives in the `onesky` Postgres
schema (renamed from `energetics`, see ADR-0002 and ADR-0009). The app's codename
stays `energetics` (the repo, the npm package, the `supabase/migrations/` folder,
and historical ADRs keep that word), only the schema OneSky's tables live in is
named `onesky`. This runbook carries the small dataset across, repoints the env
vars, verifies, and only then removes OneSky from Frequency.

For the why, see `docs/adr/0009-apps-studio-multi-app-isolation.md`. For where
everything lives, see `docs/INFRA.md`. For day-to-day operation, see
`docs/RUNBOOK.md`.

Privacy note: OneSky collects birth data (names, dates, exact times, and places of
birth). That data lives in `onesky.birth_events`, scoped to its owner by row level
security. This move keeps it in the `onesky` schema the whole way: it never lands
in another app's schema (not Hook's `public`, not `shared`), and it stays
owner-scoped on both sides.

## Projects in play

| Role | Name | Project ref | What it holds |
|---|---|---|---|
| Source (leaving) | Frequency Community | `azsqfeonabsbmemvddqd` | OneSky's `onesky` schema, moving out. Frequency goes pure after. |
| Target (arriving) | hook / Apps Studio | `qakbtenvporcfkznivdh` | OneSky lands here as the `onesky` schema, next to Hook in `public`. |

The dataset is tiny: 1 profile, 3 birth_events, and a few `system_settings` rows.
Plan the move for correctness and ownership, not for volume.

Hook is not part of this move. Hook stays exactly where it is, in the hook
project's `public` schema (53 tables, demo mode), untouched. This runbook adds the
`onesky` schema alongside it and never reads, writes, or migrates Hook's tables.

The honest part: the hook project has one `auth.users` table and one set of API
keys, shared by every app in it. After this move, OneSky uses the hook project's
keys, the same keys Hook and (later) Resonance use. Isolation between apps is the
schema plus RLS plus grants, not the keys. See the ADR for the full reasoning.

## Before you start

- You can run SQL against both projects (dashboard SQL editor, or `psql` with each
  project's connection string).
- You have the hook project's API keys to hand for the cutover:
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and
  `SUPABASE_SERVICE_ROLE_KEY` (server only, never a `NEXT_PUBLIC_` variable).
- You can edit the OneSky deploy's environment variables in Vercel.
- Never use a secret key in a `NEXT_PUBLIC_` variable, on either project, at any
  step.

Do the phases in order. Do not run the decommission SQL in phase 5 until phase 4
passes.

## Phase 1: scaffold the schema in the Studio project

Build the empty `onesky` schema in the hook project, matching what it is in
Frequency today, before any data moves.

1. **Lay the Studio foundation.** Run `supabase/studio/0001_studio_foundation.sql`
   against the hook project (`qakbtenvporcfkznivdh`). It creates the `shared`
   schema and its grants and is non-destructive: it does not touch Hook's `public`
   schema or data, and it does not create `onesky`. It is safe to re-run.
2. **Apply OneSky's migrations.** Run `supabase/migrations/0001_init.sql` through
   `0011_billing_harden.sql`, in order, against the hook project. `0001` creates the
   `onesky` schema, its tables, RLS policies, indexes, and grants; later migrations
   add profiles, the primary chart, the narrative cache, the systems catalog,
   security hardening, performance and RLS hardening, and billing. The `vector`
   extension is created in `public` and referenced as `public.vector`, so `0001`
   provisions it on this project too (Hook's `public` schema is otherwise
   untouched).
3. **Confirm the structure.** The `onesky` schema now exists in the hook project
   with all of its tables and RLS enabled, and no rows yet:

   ```sql
   -- Run against qakbtenvporcfkznivdh.
   select table_name
   from information_schema.tables
   where table_schema = 'onesky'
   order by table_name;
   -- Expect: ai_usage, birth_events, chart_computations, customers,
   -- interpretation_entries, narratives, profiles, subscriptions, syntheses,
   -- system_primitives, system_settings (and any others the migrations add).

   select count(*) from onesky.birth_events;  -- expect 0 before phase 2
   ```

Do not expose the schema to the Data API yet. Exposing happens at cutover (phase 3)
so the app does not start serving from a half-loaded schema.

## Phase 2: port the data

Move the small dataset from Frequency to the Studio project. The catch is identity:
`auth.users` is per project, so a `birth_events.user_id` from Frequency points at a
user id that does not exist in the hook project yet. Sort the owner out first, then
move the rows.

### 2a. Recreate the owner account in the Studio project

OneSky's data belongs to one account. The hook project has its own `auth.users`
pool, so that account must exist there before any owned row lands, or the
`user_id` foreign key fails and RLS has no one to scope rows to.

At this scale, recreate the single account rather than building an auth export:

1. Note the owner's email and their user id in Frequency:

   ```sql
   -- Run against azsqfeonabsbmemvddqd.
   select id, email from auth.users
   where id in (select distinct user_id from onesky.birth_events);
   ```

2. Create that account in the hook project (Dashboard, Authentication, Users, Add
   user, with the same email), or have the owner sign in to OneSky once after
   cutover to mint it. Either way you get a new user id in the hook project.
3. Capture the mapping from the old id to the new id. You will rewrite `user_id` to
   the new id when you load the rows:

   ```text
   old_user_id (azsqfeonabsbmemvddqd)  ->  new_user_id (qakbtenvporcfkznivdh)
   ```

If the owner has not signed in to the new project yet, no `onesky.profiles` row
exists for them there. Re-grant admin after they sign in once, using the command in
`docs/RUNBOOK.md` (Systems catalog and admin). The `guard_profile_is_admin` trigger
blocks setting `is_admin` from a user token, so run that grant as the service role
or in the SQL editor, exactly as the runbook shows.

### 2b. Move the rows

Two approaches. Pick one. Both move only the `onesky` schema's data, never another
app's, and never the structure (phase 1 already built that).

Either way, move tables parent-first so foreign keys resolve: `profiles` and
`birth_events`, then `chart_computations`, then `system_primitives` and
`syntheses`, then `system_settings`. Skip the narrative cache (`onesky.narratives`):
it is a server-only, content-addressed cache that regenerates on next view, so there
is nothing to migrate.

**Approach A: `pg_dump` the schema's data, then restore it.**

```bash
# Dump ONLY the onesky schema's data from Frequency (no structure, no owners).
pg_dump \
  --schema=onesky \
  --data-only \
  --no-owner --no-privileges \
  "$FREQUENCY_CONNECTION_STRING" \
  > onesky-data.sql

# Restore into the Studio project. The schema and tables already exist (phase 1),
# so this loads rows only. It never touches Hook's public schema.
psql "$HOOK_CONNECTION_STRING" < onesky-data.sql
```

The dump carries the Frequency `user_id` values. Because those ids do not exist in
the hook project's `auth.users`, rewrite them to the new owner id after the load
(one owner, so one update per owned table), then confirm nothing is left pointing at
the old id:

```sql
-- Run against qakbtenvporcfkznivdh, inside a transaction.
update onesky.birth_events set user_id = :new_user_id where user_id = :old_user_id;
-- profiles is keyed by user_id; if the dump carried the old profile row, repoint it:
update onesky.profiles    set user_id = :new_user_id where user_id = :old_user_id;
-- Verify no orphaned owner ids remain.
select count(*) from onesky.birth_events b
  left join auth.users u on u.id = b.user_id
  where u.id is null;  -- expect 0
```

If you would rather not load-then-rewrite, recreate the owner first (2a), then
hand-edit the `user_id` values in `onesky-data.sql` from the old id to the new id
before the `psql` restore.

**Approach B: `INSERT ... SELECT` through a temporary export.**

When the row counts are this small, you can skip the dump and copy rows directly.
There is no cross-project query in Postgres, so stage the data through a temporary
export (a CSV per table, or values pasted into an insert), then insert into the
Studio project with the owner id already rewritten. For example, after exporting
`birth_events` from Frequency (its columns are `id, user_id, name, date, time, lat,
lng, tz, precision, created_at`):

```sql
-- Run against qakbtenvporcfkznivdh.
insert into onesky.birth_events
  (id, user_id, name, date, time, lat, lng, tz, precision, created_at)
values
  -- one row per exported birth_event, with user_id set to :new_user_id
  (:id, :new_user_id, :name, :date, :time, :lat, :lng, :tz, :precision, :created_at);
```

Repeat per table in the parent-first order above, carrying original primary keys so
foreign keys still line up (`chart_computations.birth_event_id` and the rest), and
substituting the new owner id everywhere a `user_id` appears.

### 2c. Confirm the load

```sql
-- Run against qakbtenvporcfkznivdh.
select
  (select count(*) from onesky.profiles)       as profiles,        -- expect 1
  (select count(*) from onesky.birth_events)    as birth_events,    -- expect 3
  (select count(*) from onesky.system_settings) as system_settings; -- expect your few rows
```

## Phase 3: cutover

Point OneSky at the hook project and expose the schema, so the running app reads and
writes the Studio project from now on.

1. **Repoint the env vars** to the hook project, in Vercel (Production and Preview)
   and in your local `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://qakbtenvporcfkznivdh.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = the hook project's anon (publishable) key
   - `SUPABASE_SERVICE_ROLE_KEY` = the hook project's service role key (server only)

   Leave every other OneSky variable as it is (`ANTHROPIC_API_KEY`, the Stripe keys,
   the rate-limit keys, and the rest). Those are not project-scoped. The full list
   is in `docs/RUNBOOK.md`.
2. **Expose the schema.** In the hook project's dashboard (Settings, Data API,
   Exposed schemas), add `onesky` alongside `public`. Without this, the app connects
   but every table read returns a 404 from PostgREST. Leave `public` exposed (that
   is Hook's schema) and do this in the dashboard, not by SQL, so you do not clobber
   the project's PostgREST config.
3. **Set the auth redirect URLs** on the hook project (Authentication, URL
   Configuration). Add OneSky's origins to Redirect URLs:
   - `https://<your-domain>/**`
   - `https://<preview-pattern>-*.vercel.app/**` (optional, for preview deploys)

   Leave the project Site URL as it is. OneSky requests its own `/auth/callback`
   redirect, so it does not depend on the project Site URL. Also enable the Email
   provider (and Anonymous Sign-Ins if you use guest sign-in), matching the auth
   setup in `docs/RUNBOOK.md`.
4. **Redeploy** OneSky so the new env vars take effect.

## Phase 4: verify

Run the verification checklist at the end of this runbook before going further. The
gate is simple: do not touch phase 5 until every item passes against the hook
project.

## Phase 5: decommission OneSky from Frequency (GATED)

Only after phase 4 passes. This removes OneSky from the Frequency project so the
flagship is pure (its own data only). It is destructive and hard to reverse. It runs
only against Frequency (`azsqfeonabsbmemvddqd`) and never touches the hook project or
Hook.

**Back up first.** Dump the schema (structure and data) from Frequency before you
drop anything, and keep the file somewhere safe until you are certain the move
stuck:

```bash
pg_dump --schema=onesky --no-owner --no-privileges \
  "$FREQUENCY_CONNECTION_STRING" > onesky-frequency-backup.sql
```

```sql
-- ============================================================================
-- DO NOT RUN UNTIL VERIFIED.
-- Run this ONLY against the SOURCE project, Frequency Community
-- (azsqfeonabsbmemvddqd), and ONLY after phase 4 verification passes on the
-- hook project AND the backup above exists. This permanently removes OneSky from
-- Frequency. It does not touch the hook project, and it does not touch Hook.
-- ============================================================================
drop schema "onesky" cascade;
```

After the drop, update `docs/INFRA.md`: change OneSky's row so its project is hook /
`qakbtenvporcfkznivdh` and its schema is `onesky`, and note that Frequency no longer
hosts the `onesky` schema. Add a `CHANGELOG.md` line. Resonance moves the same way
later, through its own repo, leaving Frequency pure once both are out.

## Verification checklist (cutover verification)

Run this after phase 3, against the hook project (`qakbtenvporcfkznivdh`). This is
the cutover-verification gate for phase 5.

1. **Typecheck.** `npm run typecheck` passes.
2. **Test.** `npm run test` passes.
3. **Load the app.** Open the redeployed OneSky. The home page renders and you can
   sign in with the recreated owner account (magic link or password). A sign in that
   lands on `/login?error=auth-callback` means the redirect URLs or env vars are
   wrong: recheck phase 3.
4. **Compute a chart.** Enter birth data and compute. The chart and its synthesis
   render. Birth data you enter here is stored in `onesky.birth_events` on the hook
   project, scoped to your account.
5. **Confirm the row landed in the new project.** A new saved chart shows up where
   it should:

   ```sql
   -- Run against qakbtenvporcfkznivdh.
   select id, name, created_at from onesky.birth_events order by created_at desc limit 5;
   ```

6. **Confirm no 404 from PostgREST.** Table reads over the Data API succeed (the
   saved-charts list loads, no "table not found" in the network tab). A 404 means
   `onesky` is not in the hook project's Exposed schemas: redo phase 3, step 2.

When all six pass, phase 5 is unblocked. Until then, OneSky still has a clean home
in Frequency, so there is no rush and no risk in waiting.
