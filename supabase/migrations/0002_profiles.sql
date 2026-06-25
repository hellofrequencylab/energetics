-- Account profiles + practitioner notes.
-- One profile per user, with a switchable account type (personal | practitioner).
-- Saved charts (birth_events) gain a free-text notes field for practitioners.

create table if not exists onesky.profiles (
  user_id uuid primary key references auth.users on delete cascade,
  account_type text not null default 'personal' check (account_type in ('personal', 'practitioner')),
  display_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table onesky.profiles enable row level security;

create policy "own profile"
  on onesky.profiles for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant all on onesky.profiles to anon, authenticated, service_role;

alter table onesky.birth_events add column if not exists notes text;
