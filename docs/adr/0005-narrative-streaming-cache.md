# 0005. Stream the narrative and cache it content-addressed

Status: Accepted

## Context

The narrative layer (spec §9) turns the deterministic synthesis into prose. It
read the structure and never computes it, which we keep. Two problems remained:

- The reading was generated in one blocking call and returned as JSON, so the
  user stared at "Writing…" for the whole generation, and long readings risked
  request timeouts.
- Every view re-called the model. The same chart, reopened, paid again. Two
  people with identical birth data paid twice for an identical reading.

We also wanted a reading for the resonance comparison (platonic and intimate),
not only for a single chart.

## Decision

**Stream.** Both narrate routes (`/api/charts/narrate`, `/api/synastry/narrate`)
return `text/plain` and stream model text deltas as they arrive. Metadata travels
in response headers (`x-narrative-available`, `x-narrative-cached`,
`x-narrative-model`) so the body stays clean prose. A shared client component
(`NarrativePanel`) renders the markdown live and is used by both the single-chart
reader and the resonance reader.

**Cache, content-addressed.** The reading is a deterministic function of the
model, the system prompt, and the prompt built from the structure. We memoize it
in `energetics.narratives`, keyed by `sha256(model | system | prompt)`. A hit
serves the stored reading with no model call.

**Writes are server-only.** Rows are world-readable: the key carries no birth
data, and the value is reproducible by anyone with the same structure. Clients
get no insert/update/delete policy. The server writes with the service role
(`SUPABASE_SERVICE_ROLE_KEY`), and only writes text it just generated, so the
cache cannot be poisoned by a client. Without the service key, readings still
stream, they just regenerate each time.

## Consequences

- The reading appears immediately and fills in as it writes. Long readings no
  longer risk a timeout.
- A reading is paid for once per distinct structure, across all users. Editing a
  chart's birth data changes the structure, so it content-addresses to a fresh
  reading with no manual invalidation.
- The model stays a pure prose layer: the cache key is built only from the
  deterministic structure, so caching can never smuggle computation into the
  narrative.
- One more server-only secret to manage. It is optional: absence degrades to
  "always regenerate", never to a broken reading.
