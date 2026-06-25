-- Narrative cache (spec §9). The prose layer is a deterministic function of the
-- structural synthesis: the same model, system prompt, and user prompt always
-- yield the same reading. We memoize it so reopening a chart, or two people with
-- identical charts, never re-bills the model.
--
-- The key is a content hash of (model + system prompt + user prompt), so it holds
-- no birth data and reveals nothing on its own. Rows are world-readable, because a
-- reading is reproducible by anyone with the same structural input. Writes happen
-- ONLY server-side with the service role, and only of text the server just
-- generated, so clients can never poison the cache.

create table if not exists onesky.narratives (
  cache_key text primary key,         -- sha256(model | system | prompt)
  kind text not null check (kind in ('chart', 'resonance')),
  model text not null,
  body text not null,                 -- the generated prose (markdown)
  created_at timestamptz default now()
);

alter table onesky.narratives enable row level security;

-- World-readable: the value is a pure function of public divinatory math, keyed
-- by a hash that carries no personal data.
create policy "narratives are world-readable"
  on onesky.narratives for select using (true);

-- No insert/update/delete policy: clients read but never write. The server writes
-- cache entries with the service role, which bypasses RLS.

grant select on onesky.narratives to anon, authenticated;
grant all on onesky.narratives to service_role;
