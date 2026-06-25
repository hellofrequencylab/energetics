-- Saved resonance comparisons: a named pairing of two of the user's saved charts,
-- with the lens (platonic | intimate). The charts live in birth_events; a resonance
-- only references them, so reopening one recomputes fresh from the current charts.

create table if not exists onesky.resonances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  a_chart_id uuid not null references onesky.birth_events(id) on delete cascade,
  b_chart_id uuid not null references onesky.birth_events(id) on delete cascade,
  mode text not null default 'platonic' check (mode in ('platonic', 'intimate')),
  label text,
  created_at timestamptz default now()
);

alter table onesky.resonances enable row level security;

create policy "own resonances"
  on onesky.resonances for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant all on onesky.resonances to anon, authenticated, service_role;

create index if not exists resonances_user_idx on onesky.resonances (user_id, created_at desc);
