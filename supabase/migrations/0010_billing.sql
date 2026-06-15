-- Billing + AI cost safety (ADR-0008).
--
-- Adds the entitlement model (Stripe customers + subscriptions), an AI usage
-- ledger for per-user quotas and a global spend ceiling, a single `is_plus`
-- helper used by RLS and the app, and a free-tier cap of 3 saved charts.
--
-- Entitlement is server-enforced: clients can never grant themselves Plus.
-- Subscriptions are written only by the Stripe webhook (service role); users may
-- read their own row. The customers table is service-role only.

-- --- Stripe customer mapping (service-role only) ----------------------------
create table if not exists energetics.customers (
  user_id uuid primary key references auth.users on delete cascade,
  stripe_customer_id text unique,
  created_at timestamptz not null default now()
);
alter table energetics.customers enable row level security;
-- No policies: unreachable except via the service role.
grant all on energetics.customers to service_role;

-- --- Subscriptions (a faithful projection of the Stripe object) -------------
create table if not exists energetics.subscriptions (
  id text primary key,                       -- Stripe subscription id
  user_id uuid not null references auth.users on delete cascade,
  status text not null,                      -- trialing | active | past_due | canceled | ...
  price_id text,
  cancel_at_period_end boolean not null default false,
  current_period_end timestamptz,
  trial_end timestamptz,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table energetics.subscriptions enable row level security;

-- Users may read their own subscription; only the service role writes it.
create policy "own subscription read"
  on energetics.subscriptions for select
  using (auth.uid() = user_id);

grant select on energetics.subscriptions to authenticated;
grant all on energetics.subscriptions to service_role;

create index if not exists subscriptions_user_idx on energetics.subscriptions (user_id);

-- --- AI usage ledger (per-user quotas + global daily budget) ----------------
-- Written with the service role from the narrate routes. Anonymous callers have
-- no user_id, so they are attributed by a salted IP hash. `est_cost_usd` is the
-- worst-case pre-authorized cost of each fresh generation (cache hits are free
-- and never recorded).
create table if not exists energetics.ai_usage (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users on delete cascade,
  ip_hash text,
  feature text not null check (feature in ('chart', 'theme', 'resonance')),
  est_cost_usd numeric(10, 5) not null default 0,
  day date not null default (now() at time zone 'utc')::date,
  created_at timestamptz not null default now()
);
alter table energetics.ai_usage enable row level security;

-- Users may read their own usage (for an "X of Y left today" display). Writes are
-- service-role only.
create policy "own usage read"
  on energetics.ai_usage for select
  using (auth.uid() = user_id);

grant select on energetics.ai_usage to authenticated;
grant all on energetics.ai_usage to service_role;

create index if not exists ai_usage_user_day_idx on energetics.ai_usage (user_id, day);
create index if not exists ai_usage_ip_day_idx on energetics.ai_usage (ip_hash, day);
create index if not exists ai_usage_day_idx on energetics.ai_usage (day);
create index if not exists ai_usage_user_feature_idx on energetics.ai_usage (user_id, feature);

-- --- The single entitlement check ------------------------------------------
-- Plus = a live Stripe subscription, or an admin (so admins can preview the paid
-- experience before Stripe is wired). SECURITY DEFINER + a fixed search_path so
-- it reads the canonical rows regardless of the caller's RLS view.
create or replace function energetics.is_plus(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = energetics, pg_catalog
as $$
  select exists (
    select 1 from energetics.subscriptions
    where user_id = uid and status in ('trialing', 'active')
  ) or exists (
    select 1 from energetics.profiles
    where user_id = uid and is_admin
  );
$$;

revoke all on function energetics.is_plus(uuid) from public;
grant execute on function energetics.is_plus(uuid) to authenticated, service_role;

-- --- Free tier: at most 3 saved charts -------------------------------------
-- Enforced in the database so it cannot be bypassed by calling the API directly.
-- Plus users are unlimited. Counts only OTHER rows, so re-saving (upserting) an
-- existing chart is never blocked, only creating a genuinely new fourth chart.
create or replace function energetics.enforce_chart_limit()
returns trigger
language plpgsql
security definer
set search_path = energetics, pg_catalog
as $$
begin
  if not energetics.is_plus(new.user_id) then
    if (
      select count(*) from energetics.birth_events
      where user_id = new.user_id and id <> new.id
    ) >= 3 then
      raise exception 'CHART_LIMIT: free accounts can save up to 3 charts'
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_chart_limit on energetics.birth_events;
create trigger enforce_chart_limit
  before insert on energetics.birth_events
  for each row execute function energetics.enforce_chart_limit();
