-- Init-plan optimization for the two billing-era RLS policies, matching the 0009
-- hardening. The 0010 billing migration added these SELECT policies AFTER 0009
-- wrapped every other policy, so they kept a bare `auth.uid()`, which Postgres
-- re-evaluates once per row. Wrapping it as `(select auth.uid())` makes it a
-- one-time init-plan, evaluated once per query. Same semantics, far less work at
-- scale. Flagged by the Supabase performance advisor (0003_auth_rls_initplan).

drop policy if exists "own subscription read" on onesky.subscriptions;
create policy "own subscription read"
  on onesky.subscriptions for select
  using ((select auth.uid()) = user_id);

drop policy if exists "own usage read" on onesky.ai_usage;
create policy "own usage read"
  on onesky.ai_usage for select
  using ((select auth.uid()) = user_id);
