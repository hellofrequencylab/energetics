# The OneSky design system

This is the practical framework for building screens. It sits under the brand
direction in `docs/DESIGN.md` (voice, twilight palette, the convergence
signature) and turns it into a small, documented set of tokens and primitives so
every page is built the same way and is easy to change in one place.

The living, rendered reference is at **`/styleguide`** (source:
`src/app/styleguide/`). When you add or change a primitive, update that page.

## Principles

- **Compose from primitives, never inline.** Pages assemble `@/components/ui`
  parts. If you are writing `rounded-2xl border bg-... p-...` on a page, reach for
  a primitive instead (or add one).
- **One uniform width.** Every page, the header, and the footer share one content
  rail. Long-form text is narrowed inside with `max-w-prose`, not by the rail.
- **One primary action per view.** Exactly one amber `primary` button per screen;
  everything else is `secondary`, `ghost`, or a link.
- **Semantic tokens, not raw values.** Use `text-foreground`, `text-muted`,
  `border-border`, `bg-surface`. Do not reach for `text-star/70` or
  `border-white/10` in new code, and never hardcode hex in components (shared SVG
  colors live in `src/lib/design/`).
- **No em dashes, ever** (house rule, see `docs/DESIGN.md`).

## Tokens

Defined once in `src/app/globals.css` (`:root`) and exposed as Tailwind utilities
via `@theme`. The full swatch list is on `/styleguide`.

### Color roles (the important part)

There are two warm accents; they are not interchangeable. Using them by role is
what keeps the UI legible.

| Token | Value | Role |
| --- | --- | --- |
| `accent` (gold) | `#d4b072` | Structure: eyebrows, links, section labels, highlights, borders, the convergence map. |
| `horizon-amber` (amber) | `#ecb885` | The single primary action in a view (filled buttons) and hero glow. Lives inside the `Button` primitive, so you rarely touch it directly. |
| `accent-2` (violet) | `#8b7dff` | Tension, and lineage/tradition tags. |

Surfaces and text: `background` (page), `surface` / `surface-2` (panels),
`border` (hairlines), `foreground` (primary text), `muted` (secondary text).
`star` is a legacy alias of `foreground`; prefer `foreground` in new code.

Shape and motion: `--radius: 14px`, `--ease`, `--dur-slow|base|quick`. Honor
`prefers-reduced-motion` (globals.css already renders settled states).

## Layout

- **Container width** is the single constant `CONTAINER` in
  `src/components/ui/Container.tsx`. Change the site-wide measure there and only
  there. `SiteShell` applies it to the main column; the header and footer use it
  too, so the chrome and content align.
- **`PageHeader`** is the standard top-of-page block: optional `back` link,
  `eyebrow` (always gold), `title`, `description`, and right-aligned `actions`.
  Use it on every page so heading rhythm and eyebrow color never drift.

```tsx
<SiteShell nav={<AppSectionNav />}>
  <PageHeader
    back={{ href: "/account", label: "Back to account" }}
    eyebrow="Western tropical"
    title="Ada Lovelace"
    description="1815-12-10 · time unknown"
    actions={<ButtonLink href="#edit" variant="secondary" size="sm">Edit</ButtonLink>}
  />
  ...
</SiteShell>
```

## Navigation

- **Global header** (`SiteHeader`): wordmark, product links (Resonance, Glossary,
  Help, About), and one auth-aware action (Account when signed in, Sign in when
  not). Same on every page.
- **Section sub-nav** (`AppSectionNav` -> `SectionNav`): the role-aware row for the
  signed-in area. It renders Charts and Resonance for everyone signed in, and adds
  Admin for admins. It hides entirely when signed out. Show it by passing
  `nav={<AppSectionNav />}` to `SiteShell` on the account, chart, resonance, and
  admin pages.

Role comes from `profiles` (`is_admin`, and `account_type` of `personal` or
`practitioner`). Decide nav items and labels by role at the call site.

## Primitives (`@/components/ui`)

| Primitive | Use |
| --- | --- |
| `Container`, `CONTAINER` | The uniform width rail. |
| `PageHeader` | Top-of-page title block. |
| `Button`, `ButtonLink`, `buttonClasses` | Actions. Variants `primary` / `secondary` / `ghost` / `danger`; sizes `sm` / `md` / `lg`. `buttonClasses` skins a `<Link>` identically. |
| `Card`, `CardLabel` | The one panel. Variants `default` / `accent`; `interactive` adds hover lift for clickable cards. |
| `Badge` | The one pill. Variants `neutral` / `accent` / `lineage`. |
| `Field` + `Input` / `Textarea` / `Select` | Labelled form controls with hint/error. `inputClasses` for bespoke. |
| `Toggle` | Accessible on/off switch (role="switch"). |
| `EmptyState` | Zero states: sand mark, title, guidance, optional action. |
| `Divider` | Hairline rule. |
| `SandMark` | The convergence motif for empty states, headers, auth, 404. |
| `SectionNav` | The underline-tab sub-nav (driven by `AppSectionNav`). |

### Adding a primitive

1. Add the component under `src/components/ui/` with a short doc comment and a
   typed variant map (see `Button.tsx` for the pattern). Use `cn` from
   `@/lib/ui/cn` to compose classes.
2. Export it from `src/components/ui/index.ts`.
3. Add an example to `/styleguide` (`StyleguideClient.tsx`).
4. Add a row to the table above.

## The sand vector style

The signature look is the convergence language: faint origin points, thin gold
threads bowing inward, a glowing shared node, on twilight. It already drives the
convergence map and the per-system diagrams (`src/components/diagrams/`). For
incidental art (empty states, headers, auth, 404) use `SandMark`. Keep new art
schematic and geometric (circles, lines, soft 14px radius), in the gold / muted
thread palette, never illustrative clip-art.
