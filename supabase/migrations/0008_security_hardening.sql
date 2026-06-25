-- Security hardening from the full-site review. Three fixes, all defense at the
-- data layer so the app cannot be bypassed by talking to PostgREST directly with
-- the public anon key.
--
-- 1. Privilege escalation: profiles.is_admin was writable by its owner (the
--    "own profile" policy is `for all` with no column guard), so any signed-in
--    user could PATCH themselves to is_admin = true and pass every admin gate.
--    A trigger now forbids setting/changing is_admin from any request that
--    carries a user JWT; only trusted server-side callers (service_role or direct
--    SQL, where auth.uid() is null) can grant admin, as documented in the RUNBOOK.
--
-- 2. Resonance IDOR: the "own resonances" policy checked only user_id, not that
--    the two referenced charts belong to the caller. The with-check now requires
--    both charts to be owned by the user.
--
-- 3. Narrative cache exposure: a reading can mention user-entered names (resonance
--    and theme readings), but the table was world-readable, so anyone with the
--    public anon key could dump every body. Reads now happen server-side with the
--    service role, so the table is closed to anon/authenticated entirely.

-- 1. Guard is_admin -----------------------------------------------------------
create or replace function onesky.guard_profile_is_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- auth.uid() is non-null only for requests carrying a user JWT. Those may never
  -- set or change is_admin. service_role and direct SQL (auth.uid() is null) may.
  if auth.uid() is not null then
    if tg_op = 'INSERT' and coalesce(new.is_admin, false) then
      raise exception 'is_admin cannot be set by this role';
    elsif tg_op = 'UPDATE' and new.is_admin is distinct from old.is_admin then
      raise exception 'is_admin cannot be changed by this role';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_profile_is_admin on onesky.profiles;
create trigger guard_profile_is_admin
  before insert or update on onesky.profiles
  for each row execute function onesky.guard_profile_is_admin();

-- 2. Resonances must reference the caller's own charts ------------------------
drop policy if exists "own resonances" on onesky.resonances;
create policy "own resonances"
  on onesky.resonances for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from onesky.birth_events b
      where b.id = a_chart_id and b.user_id = auth.uid()
    )
    and exists (
      select 1 from onesky.birth_events b
      where b.id = b_chart_id and b.user_id = auth.uid()
    )
  );

-- 3. Close the narrative cache to clients (server reads via service role) ------
drop policy if exists "narratives are world-readable" on onesky.narratives;
revoke select on onesky.narratives from anon, authenticated;
