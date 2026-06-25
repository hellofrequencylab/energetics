-- "My Sky": the user's primary chart, referenced from the profile.
-- Clears automatically if that chart is deleted.

alter table onesky.profiles
  add column if not exists primary_chart_id uuid
  references onesky.birth_events(id) on delete set null;
