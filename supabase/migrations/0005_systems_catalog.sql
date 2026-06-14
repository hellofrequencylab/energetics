-- Systems catalog admin. Most systems are registered but offered off by default;
-- an admin can switch them on live. Two pieces:
--   profiles.is_admin   gate for the admin surface
--   system_settings     per-system on/off overrides over the code catalog
--
-- `system_settings` is world-readable (chart compute, including for signed-out
-- visitors, reads the effective enabled set). Writes are limited to admins.
-- `inSynthesis` is a fixed code rule, not stored here.

alter table energetics.profiles
  add column if not exists is_admin boolean not null default false;

create table if not exists energetics.system_settings (
  system_id text primary key,
  enabled boolean not null,
  updated_at timestamptz default now()
);

alter table energetics.system_settings enable row level security;

-- World-readable so compute can resolve the offered set for anyone.
create policy "system settings are world-readable"
  on energetics.system_settings for select using (true);

-- Only admins write. Three explicit policies keep select open to all.
create policy "admins insert system settings"
  on energetics.system_settings for insert
  with check (exists (select 1 from energetics.profiles p where p.user_id = auth.uid() and p.is_admin));

create policy "admins update system settings"
  on energetics.system_settings for update
  using (exists (select 1 from energetics.profiles p where p.user_id = auth.uid() and p.is_admin))
  with check (exists (select 1 from energetics.profiles p where p.user_id = auth.uid() and p.is_admin));

create policy "admins delete system settings"
  on energetics.system_settings for delete
  using (exists (select 1 from energetics.profiles p where p.user_id = auth.uid() and p.is_admin));

grant select on energetics.system_settings to anon, authenticated;
grant all on energetics.system_settings to service_role;
