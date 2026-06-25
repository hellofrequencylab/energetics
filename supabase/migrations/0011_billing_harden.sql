-- Harden 0010 (ADR-0008), matching the 0009 hardening of guard_profile_is_admin.
--
-- The chart-cap trigger function and the entitlement helper must not be invokable
-- as PostgREST RPCs by the API roles. The trigger still fires on insert (trigger
-- execution is not gated by EXECUTE), and is_plus is still callable inside the
-- SECURITY DEFINER trigger (it runs as the function owner). The app reads
-- entitlement via table selects, never this RPC, so revoking is safe and closes
-- the advisor warning plus a minor "is this user a subscriber/admin" info leak.

revoke all on function onesky.enforce_chart_limit() from public, anon, authenticated;
revoke execute on function onesky.is_plus(uuid) from public, anon, authenticated;
