"use client";

import { useState } from "react";
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  CardLabel,
  Divider,
  EmptyState,
  Field,
  Input,
  Select,
  Textarea,
  Toggle,
  SandMark,
} from "@/components/ui";

/** Small heading for each styleguide section. */
function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="font-display text-2xl font-semibold">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

const TOKENS: { name: string; className: string; note: string }[] = [
  { name: "background", className: "bg-background", note: "page base" },
  { name: "surface", className: "bg-surface", note: "panels, cards" },
  { name: "surface-2", className: "bg-surface-2", note: "raised surface" },
  { name: "border", className: "bg-border", note: "hairlines" },
  { name: "foreground", className: "bg-foreground", note: "primary text" },
  { name: "muted", className: "bg-muted", note: "secondary text" },
  { name: "accent", className: "bg-accent", note: "gold: structure, links, highlights" },
  { name: "horizon-amber", className: "bg-horizon-amber", note: "amber: the one primary action" },
  { name: "accent-2", className: "bg-accent-2", note: "violet: tension, lineage" },
  { name: "node-glow", className: "bg-node-glow", note: "convergence node" },
];

/**
 * The living reference for the OneSky UI kit. Every primitive shown with its real
 * variants, so the system is self-documenting and easy to extend. See
 * docs/DESIGN.md for the rules behind these.
 */
export function StyleguideClient() {
  const [on, setOn] = useState(true);

  return (
    <div className="space-y-14">
      <Section id="color" title="Color">
        <p className="mb-4 max-w-prose text-sm text-muted">
          Gold (accent) carries structure: eyebrows, links, highlights, borders. Amber (horizon-amber)
          is reserved for the single primary action in a view. Violet (accent-2) marks tension and
          lineage.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {TOKENS.map((t) => (
            <div key={t.name} className="rounded-xl border border-border bg-surface/40 p-3">
              <div className={`h-12 w-full rounded-lg border border-border ${t.className}`} />
              <p className="mt-2 font-mono text-xs text-foreground">{t.name}</p>
              <p className="text-xs text-muted">{t.note}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="type" title="Typography">
        <div className="space-y-2">
          <h1 className="font-display text-4xl font-semibold">Display, Fraunces</h1>
          <p className="text-base text-foreground">Body, Hanken Grotesk. The reading voice of the app.</p>
          <p className="text-sm text-muted">Muted secondary text, for metadata and hints.</p>
          <p className="font-mono text-sm text-muted">Mono, Geist Mono: 40.43, -75.18 · date-time-place</p>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Eyebrow label</p>
        </div>
      </Section>

      <Section id="buttons" title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="primary" disabled>
            Disabled
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
          <ButtonLink href="#buttons" variant="secondary" size="sm">
            Link as button
          </ButtonLink>
        </div>
      </Section>

      <Section id="badges" title="Badges">
        <div className="flex flex-wrap items-center gap-3">
          <Badge>neutral</Badge>
          <Badge variant="accent">3 sources</Badge>
          <Badge variant="lineage">living tradition</Badge>
        </div>
      </Section>

      <Section id="cards" title="Cards">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardLabel>Default</CardLabel>
            <p className="mt-1.5 text-sm text-muted">The neutral panel surface.</p>
          </Card>
          <Card variant="accent">
            <CardLabel>Accent</CardLabel>
            <p className="mt-1.5 text-sm text-muted">A highlighted, gold-tinted panel.</p>
          </Card>
          <Card interactive>
            <CardLabel>Interactive</CardLabel>
            <p className="mt-1.5 text-sm text-muted">Lifts on hover, for clickable cards.</p>
          </Card>
        </div>
      </Section>

      <Section id="forms" title="Forms">
        <div className="grid gap-4 sm:max-w-md">
          <Field label="Full name" htmlFor="sg-name" hint="Used for name numerology. Optional.">
            <Input id="sg-name" placeholder="Ada Lovelace" />
          </Field>
          <Field label="Tradition" htmlFor="sg-select">
            <Select id="sg-select" defaultValue="western">
              <option value="western">Western tropical</option>
              <option value="vedic">Vedic</option>
            </Select>
          </Field>
          <Field label="Notes" htmlFor="sg-notes" error="This field is required.">
            <Textarea id="sg-notes" rows={3} placeholder="A few words" />
          </Field>
          <div className="flex items-center gap-3">
            <Toggle checked={on} onChange={setOn} label="Demo toggle" />
            <span className="text-sm text-muted">Toggle is {on ? "on" : "off"}</span>
          </div>
        </div>
      </Section>

      <Section id="empty" title="Empty state">
        <EmptyState
          title="No charts yet"
          description="Add a birth moment to read it across every system."
          action={<Button variant="primary">Add a chart</Button>}
        />
      </Section>

      <Section id="mark" title="Sand mark">
        <p className="mb-3 max-w-prose text-sm text-muted">
          The signature convergence motif, for empty states, section headers, auth, and 404.
        </p>
        <SandMark className="h-20 w-32" />
        <Divider className="mt-8" />
      </Section>
    </div>
  );
}
