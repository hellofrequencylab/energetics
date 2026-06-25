/**
 * OneSky's data lives in its own isolated `onesky` Postgres schema inside a
 * shared Supabase project (kept apart from anything else in that project). Every
 * data client sets `db.schema` to this so bare `.from("birth_events")` calls
 * resolve to `onesky.birth_events`, never `public.*`. Auth is unaffected. It
 * always uses the `auth` schema regardless of this setting.
 *
 * NOTE: the schema must also be added to the project's *Exposed schemas* in
 * Supabase → Settings → API for PostgREST to serve it.
 */
export const DB_SCHEMA = "onesky" as const;
