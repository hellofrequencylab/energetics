-- Energetics — initial schema (architecture spec §10)
-- The sky is computed once; engines are isolated; synthesis reads only
-- normalized, provenance-tagged primitives. This schema mirrors that:
--   birth_events  → single source of truth for birth data
--   chart_computations → cached pure-engine native output (version-keyed)
--   system_primitives  → denormalized ontology primitives (queryable)
--   syntheses          → deterministic synthesis snapshots
--   interpretation_entries → tiered corpora; pgvector for RETRIEVAL ONLY (§9)

create extension if not exists vector;

-- Birth data: single source of truth -----------------------------------------
create table if not exists birth_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  name text,
  date date not null,                 -- always known
  time time,                          -- null when unknown
  lat double precision,
  lng double precision,
  tz text,                            -- IANA
  precision text not null check (precision in ('date', 'date-time', 'date-time-place')),
  created_at timestamptz default now()
);

-- Cached pure-engine output, keyed by all version inputs → reproducible --------
create table if not exists chart_computations (
  id uuid primary key default gen_random_uuid(),
  birth_event_id uuid not null references birth_events on delete cascade,
  system_id text not null,
  ephemeris_version text not null,
  corpus_version text not null,
  native jsonb not null,              -- NativeResult
  computed_at timestamptz default now(),
  unique (birth_event_id, system_id, ephemeris_version, corpus_version)
);

-- Queryable primitives (denormalized from native via adapter) -----------------
create table if not exists system_primitives (
  id bigint generated always as identity primary key,
  computation_id uuid not null references chart_computations on delete cascade,
  axis text not null,
  value text not null,
  weight real not null,
  source text not null,               -- engine id
  derived_from text not null check (derived_from in ('ephemeris', 'date', 'name')),
  native_factor text not null
);
create index if not exists system_primitives_computation_idx on system_primitives (computation_id);
create index if not exists system_primitives_axis_value_idx on system_primitives (axis, value);

-- Synthesis snapshots (records every version for reproducibility) -------------
create table if not exists syntheses (
  id uuid primary key default gen_random_uuid(),
  birth_event_id uuid not null references birth_events on delete cascade,
  ontology_version text not null,
  convergences jsonb not null,
  tensions jsonb not null,
  created_at timestamptz default now()
);

-- Interpretation corpora — tiered, versioned, embedded for retrieval ONLY -----
create table if not exists interpretation_entries (
  id bigint generated always as identity primary key,
  system_id text not null,
  factor_key text not null,
  corpus_version text not null,
  quick_guide text not null,
  deep_dive text,
  embedding vector(1536),             -- pgvector: search/deep-dive ONLY (§9)
  unique (system_id, factor_key, corpus_version)
);

-- Row-level security ----------------------------------------------------------
-- birth_events and downstream rows are scoped to the owning user; interpretation
-- corpora are global read.
alter table birth_events enable row level security;
alter table chart_computations enable row level security;
alter table system_primitives enable row level security;
alter table syntheses enable row level security;
alter table interpretation_entries enable row level security;

create policy "own birth events"
  on birth_events for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own chart computations"
  on chart_computations for all
  using (exists (select 1 from birth_events b where b.id = birth_event_id and b.user_id = auth.uid()))
  with check (exists (select 1 from birth_events b where b.id = birth_event_id and b.user_id = auth.uid()));

create policy "own system primitives"
  on system_primitives for all
  using (exists (
    select 1 from chart_computations c
    join birth_events b on b.id = c.birth_event_id
    where c.id = computation_id and b.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from chart_computations c
    join birth_events b on b.id = c.birth_event_id
    where c.id = computation_id and b.user_id = auth.uid()
  ));

create policy "own syntheses"
  on syntheses for all
  using (exists (select 1 from birth_events b where b.id = birth_event_id and b.user_id = auth.uid()))
  with check (exists (select 1 from birth_events b where b.id = birth_event_id and b.user_id = auth.uid()));

create policy "interpretation corpora are world-readable"
  on interpretation_entries for select using (true);
