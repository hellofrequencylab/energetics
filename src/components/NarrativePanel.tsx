"use client";

import { useEffect, useRef, useState } from "react";
import { UpgradePrompt } from "@/components/billing/UpgradePrompt";

/**
 * The prose reading panel, shared by the single-chart reader and the resonance
 * reader. It streams text from a narrate endpoint token by token, renders light
 * markdown live, and shows whether the reading came fresh from the model or from
 * the cache. It reads the deterministic synthesis above it and never computes it.
 *
 * With `autoStart`, the reading writes itself as soon as the output renders, so
 * the AI read is part of every chart output rather than waiting for a click. The
 * content-addressed cache keeps repeat views free.
 */
export function NarrativePanel({
  endpoint,
  body,
  title = "Reading",
  ctaLabel = "Write the reading",
  idleBlurb,
  autoStart = false,
  initial,
}: {
  endpoint: string;
  body: unknown;
  title?: string;
  ctaLabel?: string;
  idleBlurb: string;
  autoStart?: boolean;
  /** A reading already saved for this chart. Shown at once, refreshed on demand. */
  initial?: { text: string; model?: string } | null;
}) {
  const [state, setState] = useState<"idle" | "streaming" | "done" | "gated">(initial ? "done" : "idle");
  const [text, setText] = useState(initial?.text ?? "");
  const [gate, setGate] = useState<{ message: string; upgrade: boolean } | null>(null);
  const [meta, setMeta] = useState<{ available: boolean; cached: boolean; model?: string }>({
    available: true,
    cached: !!initial,
    model: initial?.model,
  });
  // Guards the auto-start so it fires once per mount (not twice under StrictMode).
  const started = useRef(false);

  useEffect(() => {
    // Auto-write the first reading only when there is none saved yet.
    if (autoStart && !initial && !started.current) {
      started.current = true;
      void run();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  async function run() {
    setState("streaming");
    setText("");
    setGate(null);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      // A gate response (Plus feature, daily limit, or budget pause) arrives as
      // JSON, not prose. Show an invitation instead of streaming it as text.
      if (res.status === 402 || res.status === 429 || res.status === 503) {
        const info = (await res.json().catch(() => null)) as { error?: string; upgrade?: boolean } | null;
        setGate({
          message: info?.error ?? "This reading is not available right now.",
          upgrade: res.status === 402 || info?.upgrade === true,
        });
        setState("gated");
        return;
      }
      setMeta({
        available: res.headers.get("x-narrative-available") !== "false",
        cached: res.headers.get("x-narrative-cached") === "true",
        model: res.headers.get("x-narrative-model") ?? undefined,
      });
      if (!res.body) {
        setText(await res.text());
        setState("done");
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setText(acc);
      }
      setState("done");
    } catch {
      setMeta({ available: false, cached: false });
      setText("The reading could not be generated right now. Please try again.");
      setState("done");
    }
  }

  return (
    <section className="rounded-xl border border-border bg-surface/60 p-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-accent-2">
          ✦ {title}
        </h3>
        {state === "idle" && (
          <button
            onClick={run}
            className="rounded-lg border border-accent-2/40 px-3 py-1 text-xs font-medium text-accent-2 transition hover:bg-accent-2/10"
          >
            {ctaLabel}
          </button>
        )}
        {state === "done" && meta.available && (
          <button onClick={run} className="text-xs text-muted transition hover:text-foreground">
            Refresh reading
          </button>
        )}
      </div>

      {state === "idle" && <p className="text-sm text-muted">{idleBlurb}</p>}

      {state === "gated" && gate && (
        <UpgradePrompt
          message={gate.message}
          cta={gate.upgrade ? "See OneSky Plus" : "Got it"}
          href={gate.upgrade ? "/plus" : "#"}
          onDismiss={() => {
            setGate(null);
            setState("idle");
          }}
        />
      )}

      {state === "streaming" && !text && <p className="text-sm text-muted">Reading the synthesis…</p>}

      {state !== "idle" &&
        text &&
        (meta.available ? (
          <article className="space-y-3 text-[15px] leading-relaxed text-foreground/90">
            {renderMarkdown(text)}
            {state === "streaming" && (
              <span className="ml-0.5 inline-block h-4 w-[3px] animate-pulse bg-accent-2/70 align-middle" aria-hidden />
            )}
            {state === "done" && (
              <p className="pt-2 text-xs text-muted">
                {meta.cached
                  ? "Saved to your chart"
                  : meta.model
                    ? `Written live by ${meta.model}`
                    : "Written live"}
                . Reads the synthesis above, never computes it.
              </p>
            )}
          </article>
        ) : (
          <p className="text-sm text-muted">{text}</p>
        ))}
    </section>
  );
}

/**
 * Inline markdown: **bold** and *italic*. Returns React nodes so the asterisks
 * render as emphasis instead of showing as literal characters.
 */
function inline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*|\*([^*]+)\*|__([^_]+)__/g;
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[1] != null || m[3] != null) nodes.push(<strong key={key++}>{m[1] ?? m[3]}</strong>);
    else nodes.push(<em key={key++}>{m[2]}</em>);
    last = re.lastIndex;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

/** Minimal markdown: ## / ### headings, - bullets, paragraphs, inline bold/italic. */
function renderMarkdown(text: string) {
  const blocks: React.ReactNode[] = [];
  let list: string[] = [];
  let para: string[] = [];
  const flushPara = () => {
    if (para.length) {
      blocks.push(<p key={`p${blocks.length}`}>{inline(para.join(" "))}</p>);
      para = [];
    }
  };
  const flushList = () => {
    if (list.length) {
      blocks.push(
        <ul key={`l${blocks.length}`} className="list-disc space-y-1 pl-5">
          {list.map((it, i) => (
            <li key={i}>{inline(it)}</li>
          ))}
        </ul>,
      );
      list = [];
    }
  };
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    const heading = line.startsWith("### ") ? line.slice(4) : line.startsWith("## ") ? line.slice(3) : null;
    if (heading !== null) {
      flushPara();
      flushList();
      blocks.push(
        <h4 key={`h${blocks.length}`} className="pt-2 text-sm font-semibold uppercase tracking-wider text-accent">
          {inline(heading)}
        </h4>,
      );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      flushPara();
      list.push(line.slice(2));
    } else if (line === "") {
      flushPara();
      flushList();
    } else {
      flushList();
      para.push(line);
    }
  }
  flushPara();
  flushList();
  return blocks;
}
