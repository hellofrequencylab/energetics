-- "My Sky": the user's primary chart, referenced from the profile.
-- Clears automatically if that chart is deleted.

alter table energetics.profiles
  add column if not exists primary_chart_id uuid
  references energetics.birth_events(id) on delete set null;
