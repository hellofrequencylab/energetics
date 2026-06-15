import type { Metadata } from "next";
import { offeredMeta } from "@/lib/core/registry";
import { isBuilt } from "@/lib/core/registry";
import { SiteShell } from "@/components/site/SiteShell";
import { Badge, Card, Divider, PageHeader } from "@/components/ui";
import {
  CATEGORIES,
  CHANGELOG,
  FAQ,
  LINEAGE_LABEL,
  SYSTEM_BLURBS,
  type Block,
} from "@/lib/help/content";

export const metadata: Metadata = {
  title: "Help",
  description:
    "How to read your chart, how the synthesis works, how your data is handled, and how OneSky is built.",
  alternates: { canonical: "/help" },
};

/** Renders one content block. Tiny on purpose: no markdown dependency. */
function BlockView({ block }: { block: Block }) {
  if (block.type === "p") return <p className="mt-3 text-sm leading-relaxed text-muted">{block.text}</p>;
  if (block.type === "list") {
    return (
      <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted">
        {block.items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    );
  }
  return (
    <ol className="mt-3 space-y-2">
      {block.items.map((item, i) => (
        <li key={i} className="flex gap-3 text-sm leading-relaxed">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-accent text-xs font-semibold text-accent">
            {i + 1}
          </span>
          <span className="text-muted">{item}</span>
        </li>
      ))}
    </ol>
  );
}

export default function HelpPage() {
  const systems = offeredMeta();

  // FAQ structured data so search and AI tools can quote it directly.
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  return (
    <SiteShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <div className="mb-6 flex flex-wrap justify-end gap-3 text-xs text-muted">
        <a href="#systems" className="hover:text-foreground">Systems</a>
        <a href="#faq" className="hover:text-foreground">FAQ</a>
        <a href="#whats-new" className="hover:text-foreground">What is new</a>
      </div>

      <PageHeader
        eyebrow="Help Center"
        title="How OneSky works"
        description="How to read your chart, how the synthesis finds agreement, how your data is handled, and how OneSky is built. Your birth data stays yours."
      />

      {/* Categories and articles */}
      <div className="space-y-12">
        {CATEGORIES.map((cat) => (
          <section key={cat.slug} id={cat.slug} className="scroll-mt-20">
            <h2 className="text-xl font-semibold">{cat.title}</h2>
            <p className="mt-1 text-sm text-muted">{cat.blurb}</p>
            <div className="mt-5 space-y-6">
              {cat.articles.map((a) => (
                <article key={a.slug} id={`${cat.slug}-${a.slug}`} className="scroll-mt-20">
                  <Card>
                    <h3 className="font-semibold">{a.title}</h3>
                    <p className="mt-1 text-sm italic text-muted/80">{a.summary}</p>
                    {a.body.map((block, i) => (
                      <BlockView key={i} block={block} />
                    ))}
                  </Card>
                </article>
              ))}
            </div>
          </section>
        ))}

        {/* Systems reference, driven by the live registry */}
        <section id="systems" className="scroll-mt-20">
          <h2 className="text-xl font-semibold">The systems</h2>
          <p className="mt-1 text-sm text-muted">
            Every tradition OneSky reads, with its lineage named. This list comes straight from the
            engine, so it always matches what the app runs.
          </p>
          <div className="mt-5 space-y-2">
            {systems.map((m) => (
              <Card
                key={m.id}
                className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{m.displayName}</span>
                    {!isBuilt(m) && <Badge>In progress</Badge>}
                  </div>
                  <p className="mt-0.5 text-sm text-muted">
                    {SYSTEM_BLURBS[m.id] ?? "A tradition OneSky reads from your birth moment."}
                  </p>
                </div>
                <Badge variant="lineage" className="shrink-0">
                  {LINEAGE_LABEL[m.lineage] ?? m.lineage}
                </Badge>
              </Card>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-20">
          <h2 className="text-xl font-semibold">Common questions</h2>
          <div className="mt-5 space-y-2">
            {FAQ.map((f, i) => (
              <Card key={i}>
                <details className="group">
                  <summary className="cursor-pointer list-none font-medium marker:hidden">
                    <span className="flex items-center justify-between gap-3">
                      {f.question}
                      <span className="text-muted transition group-open:rotate-45">+</span>
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{f.answer}</p>
                </details>
              </Card>
            ))}
          </div>
        </section>

        {/* What's new */}
        <section id="whats-new" className="scroll-mt-20">
          <h2 className="text-xl font-semibold">What is new</h2>
          <p className="mt-1 text-sm text-muted">Recent changes, newest first.</p>
          <div className="mt-5 space-y-5">
            {CHANGELOG.map((entry, i) => (
              <div key={i} className="border-l-2 border-accent/40 pl-4">
                <div className="flex items-baseline gap-3">
                  <time className="font-mono text-xs text-muted">{entry.date}</time>
                  <h3 className="font-medium">{entry.title}</h3>
                </div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
                  {entry.notes.map((note, j) => (
                    <li key={j}>{note}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </div>

      <Divider className="mt-14" />
      <footer className="mt-6 text-sm text-muted">
        Still stuck? Email{" "}
        <a className="text-accent hover:underline" href="mailto:hello@onesky.app">
          hello@onesky.app
        </a>{" "}
        and tell us what happened and what you expected.
      </footer>
    </SiteShell>
  );
}
