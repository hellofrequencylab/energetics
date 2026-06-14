-- Account profiles + practitioner notes.
-- One profile per user, with a switchable account type (personal | practitioner).
-- Saved charts (birth_events) gain a free-text notes field for practitioners.

create table if not exists energetics.profiles (
  user_id uuid primary key references auth.users on delete cascade,
  account_type text not null default 'personal' check (account_type in ('personal', 'practitioner')),
  display_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table energetics.profiles enable row level security;

create policy "own profile"
  on energetics.profiles for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant all on energetics.profiles to anon, authenticated, service_role;

alter table energetics.birth_events add column if not exists notes text;
