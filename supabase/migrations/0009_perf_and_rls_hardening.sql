-- Performance and RLS hardening from the full-site review, driven by the
-- Supabase database advisors. Three classes of fix, all safe and additive:
--
-- 1. Covering indexes for foreign keys. Postgres does not auto-index the
--    referencing side of a foreign key, so ownership lookups and cascade
--    deletes (e.g. removing a chart that has resonances/syntheses) do
--    sequential scans. Index every FK column the advisor flagged.
--
-- 2. RLS init-plan optimization. A policy that calls `auth.uid()` bare
--    re-evaluates it once PER ROW. Wrapping it as `(select auth.uid())` makes
--    Postgres treat it as a one-time init-plan, evaluated once per query. Same
--    semantics, far less work at scale. Every owner/admin policy is rewritten.
--
-- 3. Lock down the SECURITY DEFINER trigger. `guard_profile_is_admin` is a
--    trigger function, but PostgREST exposes any function the API roles can
--    execute as an RPC endpoint. Revoke execute from the API roles so it can
--    only ever fire as the trigger it is, never be called directly.

-- 1. Covering indexes for foreign keys ---------------------------------------
create index if not exists birth_events_user_id_idx
  on onesky.birth_events (user_id);
create index if not exists profiles_primary_chart_id_idx
  on onesky.profiles (primary_chart_id);
create index if not exists resonances_a_chart_id_idx
  on onesky.resonances (a_chart_id);
create index if not exists resonances_b_chart_id_idx
  on onesky.resonances (b_chart_id);
create index if not exists syntheses_birth_event_id_idx
  on onesky.syntheses (birth_event_id);

-- 2. RLS init-plan optimization (wrap auth.uid() in a scalar subquery) --------
drop policy if exists "own birth events" on onesky.birth_events;
create policy "own birth events"
  on onesky.birth_events for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "own chart computations" on onesky.chart_computations;
create policy "own chart computations"
  on onesky.chart_computations for all
  using (exists (select 1 from onesky.birth_events b where b.id = birth_event_id and b.user_id = (select auth.uid())))
  with check (exists (select 1 from onesky.birth_events b where b.id = birth_event_id and b.user_id = (select auth.uid())));

drop policy if exists "own system primitives" on onesky.system_primitives;
create policy "own system primitives"
  on onesky.system_primitives for all
  using (exists (
    select 1 from onesky.chart_computations c
    join onesky.birth_events b on b.id = c.birth_event_id
    where c.id = computation_id and b.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from onesky.chart_computations c
    join onesky.birth_events b on b.id = c.birth_event_id
    where c.id = computation_id and b.user_id = (select auth.uid())
  ));

drop policy if exists "own syntheses" on onesky.syntheses;
create policy "own syntheses"
  on onesky.syntheses for all
  using (exists (select 1 from onesky.birth_events b where b.id = birth_event_id and b.user_id = (select auth.uid())))
  with check (exists (select 1 from onesky.birth_events b where b.id = birth_event_id and b.user_id = (select auth.uid())));

drop policy if exists "own profile" on onesky.profiles;
create policy "own profile"
  on onesky.profiles for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Resonances keep the 0008 chart-ownership checks; only auth.uid() is wrapped.
drop policy if exists "own resonances" on onesky.resonances;
create policy "own resonances"
  on onesky.resonances for all
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from onesky.birth_events b
      where b.id = a_chart_id and b.user_id = (select auth.uid())
    )
    and exists (
      select 1 from onesky.birth_events b
      where b.id = b_chart_id and b.user_id = (select auth.uid())
    )
  );

drop policy if exists "admins insert system settings" on onesky.system_settings;
create policy "admins insert system settings"
  on onesky.system_settings for insert
  with check (exists (select 1 from onesky.profiles p where p.user_id = (select auth.uid()) and p.is_admin));

drop policy if exists "admins update system settings" on onesky.system_settings;
create policy "admins update system settings"
  on onesky.system_settings for update
  using (exists (select 1 from onesky.profiles p where p.user_id = (select auth.uid()) and p.is_admin))
  with check (exists (select 1 from onesky.profiles p where p.user_id = (select auth.uid()) and p.is_admin));

drop policy if exists "admins delete system settings" on onesky.system_settings;
create policy "admins delete system settings"
  on onesky.system_settings for delete
  using (exists (select 1 from onesky.profiles p where p.user_id = (select auth.uid()) and p.is_admin));

-- 3. Keep the admin-guard trigger function off the PostgREST RPC surface ------
revoke execute on function onesky.guard_profile_is_admin() from anon, authenticated, public;
