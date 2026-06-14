# OneSky design language and site scope

Many traditions. One sky. This is the source of truth for the OneSky web
experience: the marketing site and the web entry point to the profile. It turns
positioning into an implementable spec. Read the architecture docs for the why;
this is the how.

## Two hard content rules

These apply to every word in the product: headlines, body, microcopy, buttons,
tooltips, errors, alt text, everywhere.

1. **No em dashes. Anywhere. Ever.** Replace an em dash with a period, a comma, a
   colon, parentheses, or the word "and." Restructure the sentence if needed.
2. **Write from the user's side of the screen.** Active voice, sentence case,
   plain verbs, specific over clever. Name things by what the person controls,
   never by how the system is built.

## Invariants

- One primary action per view. Secondary actions stay visually subordinate.
- The quality floor is non-negotiable: responsive to mobile, visible keyboard
  focus, reduced motion respected, accessible contrast.
- Privacy is stated plainly near any point where birth data is collected.

## What we are building

- **Marketing site**: the public sales page that earns the free signup.
- **Web profile entry**: account creation, birth-data intake, the free chart
  view, and the paywall "glimpse" that teases convergence and routes to checkout.

The web is the acquisition and checkout surface. The native app is the
daily-engagement surface later. One account is the spine across both.

## Tech stack

Next.js (App Router), TypeScript, Tailwind v4, shadcn/ui, Vercel. Supabase for
auth and entitlements. Stripe for web checkout. Resend for transactional email.
Match the stack already in use.

## Design language: editorial twilight

The brand material is the sky at twilight: the one moment it holds many lights at
once. That is the name made visible. Many traditions, one sky.

The single most important guardrail: do not let this collapse into the common
AI-default look of a warm cream background with a high-contrast serif and a
terracotta accent. The primary atmosphere is twilight: a deep indigo base warming
to a glowing horizon, not a cream editorial page. Cream (bone) appears only as a
secondary reading surface for long-form depth content. The identity is carried by
the convergence graph, not by a serif-plus-warm-accent combination. If a section
starts to read as generic editorial, push it back toward the sky.

Principles:

- The hero is the thesis. Open with the convergence reveal over a twilight sky.
- Typography carries the personality. A characterful editorial serif for display,
  used with restraint, over a warm humanist sans for body.
- Structure encodes meaning. Number a sequence only where order is real
  information (the three-step "how it works" is a genuine sequence).
- Motion is one orchestrated moment. The convergence animation is the moment.
  Everything else stays calm.
- Spend boldness once. The convergence graph is the memorable element. Keep the
  rest disciplined.

## Design tokens

Hex values are the intended direction. Refine in build, but keep the
relationships: dark twilight primary, warm horizon accent, bone as a secondary
reading surface.

```
--midnight:      #121535   /* primary dark atmosphere: hero, convergence, pricing, CTA */
--dusk:          #2A2C5A   /* lifted surface on dark: cards, dividers on twilight */
--ink:           #1C1830   /* text on light surfaces (warm indigo-black, not pure black) */
--star:          #EDE9F2   /* text and fine lines on dark */
--horizon-amber: #E7B17E   /* warm horizon glow, primary accent */
--horizon-rose:  #E29A86   /* secondary warm accent, used sparingly */
--bone:          #F4EFE6   /* secondary reading surface for long-form depth sections only */
```

Convergence thread accents (muted, for the signature graph only, kept desaturated
so it never becomes rainbow kitsch):

```
--thread-gold:   #C8A86A
--thread-teal:   #6E9C97
--thread-violet: #8A7DB0
--thread-rose:   #C58B83
--node-glow:     #F3D9A8   /* the bright shared node where threads converge */
```

Use the horizon accents as a glow or gradient on the twilight base, not as flat
swatches on cream. The page rhythm alternates twilight and bone: hero,
convergence, pricing, and final CTA on twilight; systems and depth-reading
sections on bone.

Type (all swappable, but avoid the families reached for on every project):

- Display (serif, with restraint): Fraunces. Used for the hero line and section
  leads only.
- Body (humanist sans): General Sans or Switzer. Avoid defaulting to Inter.
- Data and coordinates (mono): Geist Mono. Used for real astronomy values, which
  grounds the product in the genuine math the engine computes.

Spacing, radius, motion:

```
--radius:        14px      /* soft, not pill, not zero */
--ease:          cubic-bezier(0.22, 1, 0.36, 1)
--dur-slow:      700ms     /* convergence reveal, hero */
--dur-base:      320ms     /* scroll reveals, section transitions */
--dur-quick:     160ms     /* hover, focus, micro-interactions */
```

Generous vertical rhythm. Whitespace is part of the brand.

## The signature: the convergence graph

The one element OneSky is remembered by. It is the logo behavior, the hero
moment, and a recurring section divider.

- Form: faint threads (each a tradition) enter from the edges as thin lines and
  points, drift inward, and meet at shared nodes near the center, where they
  brighten to `--node-glow`. Threads use the muted `--thread-*` accents; the
  shared nodes are the only bright points.
- Hero behavior: on load, threads animate inward over `--dur-slow` and settle as
  the nodes light up. It plays once, respects reduced motion (render the settled
  state immediately), and never loops distractingly.
- As a motif: a simplified static version works as a section divider and as the
  mark in the nav and footer.
- In product: the same visual language renders the real convergence map in the
  profile, so the marketing signature and the product feature are one idea.

Build it as a self-contained, themeable SVG or canvas component with a
`prefersReducedMotion` path and no heavy dependencies.

## Component inventory

Marketing: `SiteNav`, `Hero`, `EmpathyBeat`, `HowItWorks`, `ConvergenceShowcase`,
`SystemsIntegrity` (on bone), `SocialProof`, `Pricing` (on twilight), `Faq`,
`FinalCta`, `StickyMobileCta`, `SiteFooter`.

Web app shell: `AuthForms`, `BirthIntake`, `ChartView`, `ConvergenceGlimpse`,
`Paywall`.

## Standardized chrome

Every page outside the immersive landing uses one shared chrome
(`src/components/site/`): `SiteHeader` (wordmark, primary navigation, an
auth-aware action), `SiteFooter` (brand, link columns, the plain privacy line),
composed by `SiteShell` on the single app background. The landing keeps its
bespoke hero header but shares `SiteFooter`. The palette is warm and high
contrast: a warm dark background, warm off-white body text, and lighter secondary
text, with a comfortable base type scale (see the tokens above).

## Per-system diagrams

Each tradition is drawn in its own traditional form from the computed data
(`src/components/diagrams/`): the Human Design bodygraph, the BaZi four pillars,
the Maya kin with a bar-and-dot tone, the Dreamspell signature, the Tarot birth
cards, the numerology life path, and the Western chart wheel. All artwork is
original and schematic, never a reproduction of a published deck or carved glyph.

## Landing page, section by section

1. Hero (twilight). H1: "Many traditions. One sky." Subhead: "See your birth
   moment through every tradition, and where they agree." Visual: the convergence
   reveal. Primary CTA: "See your sky, free." Beneath it, small and calm: "Your
   birth data stays yours."
2. Empathy beat. One short statement that names the depth ceiling.
3. How it works (three real steps). Enter your birth moment. See every tradition,
   kept whole. Watch them converge. Show real screenshots, framed as benefits.
4. Convergence showcase. The hero idea expanded. State plainly that nothing else
   keeps the systems separate and shows only real overlap.
5. Systems and integrity (bone). Each tradition true to its roots, modern
   reconstructions labeled, living lineages honored.
6. Social proof. Founder credibility and beta quotes beside the CTAs.
7. Pricing (twilight). Free obvious. Annual highlighted as the default value.
   Optional lifetime as the anchor. One action per plan.
8. FAQ. Real objections, structured as question-and-answer blocks with schema.
9. Final CTA (twilight). The convergence motif, one action.

A quiet through-line: start on the web, carry it in your pocket.

## Web app entry flow

1. Sign up (Supabase Auth). Minimal fields.
2. Birth intake. Date required. Time and place optional and unlock more. Resolve
   timezone from place. Surface the precision tier honestly. Offer an "I am not
   sure of my time" path. Use the mono face for coordinates and degrees.
3. Free chart view. The big three plus a taste of one full system. Land in under
   two minutes from arrival.
4. Convergence glimpse. Show that crossover exists, detail partially revealed, so
   there is something concrete to want. The upgrade trigger lives here, at the aha.
5. Paywall and checkout. Entitlement-driven, warm in tone, routing to web
   checkout. After purchase, the account unlocks everything across web and app.

## Voice

Warm authority. Intelligent, plain-spoken, grounded. Reverent about the
traditions without being precious. Confident about the rigor without being
clinical. A control says what it does ("See your sky," not "Submit"). Errors do
not apologize and are never vague: say what happened and how to fix it. An empty
screen is an invitation to act.

Voice test. Good: "You have read your horoscope. Now read everything the sky has
to say." Avoid: "Unlock your cosmic blueprint with our cutting-edge AI astrology
engine."

## Responsive, motion, accessibility

- Mobile first. The hero must read while the user is already scrolling. Keep the
  sticky mobile CTA present through the scroll.
- One orchestrated motion (the convergence reveal). Scroll reveals are gentle and
  brief. When reduced motion is set, render settled states immediately.
- Accessibility floor. Visible keyboard focus on every interactive element.
  Sufficient contrast for warm text on twilight and ink on bone. Label the
  convergence graph for assistive tech.

## Performance and SEO

- Speed is conversion. Aim for sub-second loads. Use the Vercel edge, disciplined
  images, lazy loading below the fold. Keep the convergence component light.
- Lean navigation: how it works, the systems, pricing, plus the primary CTA.
- SEO and AI discoverability. Structure the FAQ as real question-and-answer
  blocks with schema. Open key sections with a direct, concise answer.
- Instrument the funnel from day one: paywall views, signups, trial starts,
  conversion, churn.

## Build phasing

1. Foundation. Tokens, type, base layout, the `ConvergenceGraph` component
   (animated plus reduced-motion path).
2. Marketing site. Hero through footer, in order.
3. Auth and intake. Supabase Auth, `BirthIntake`, precision handling.
4. Free chart and glimpse. `ChartView`, `ConvergenceGlimpse`.
5. Paywall and checkout. Entitlement gating, Stripe web checkout, account-wide
   unlock.
6. Polish. Performance, accessibility, responsive, FAQ schema, funnel
   instrumentation.
