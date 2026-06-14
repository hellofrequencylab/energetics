"use client";

import { useEffect, useRef, useState } from "react";

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
}: {
  endpoint: string;
  body: unknown;
  title?: string;
  ctaLabel?: string;
  idleBlurb: string;
  autoStart?: boolean;
}) {
  const [state, setState] = useState<"idle" | "streaming" | "done">("idle");
  const [text, setText] = useState("");
  const [meta, setMeta] = useState<{ available: boolean; cached: boolean; model?: string }>({
    available: true,
    cached: false,
  });
  // Guards the auto-start so it fires once per mount (not twice under StrictMode).
  const started = useRef(false);

  useEffect(() => {
    if (autoStart && !started.current) {
      started.current = true;
      void run();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  async function run() {
    setState("streaming");
    setText("");
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
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
            Rewrite
          </button>
        )}
      </div>

      {state === "idle" && <p className="text-sm text-muted">{idleBlurb}</p>}

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
                  ? "From the reading cache"
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

/** Minimal markdown: ## headings, - bullets, paragraphs. */
function renderMarkdown(text: string) {
  const blocks: React.ReactNode[] = [];
  let list: string[] = [];
  let para: string[] = [];
  const flushPara = () => {
    if (para.length) {
      blocks.push(<p key={`p${blocks.length}`}>{para.join(" ")}</p>);
      para = [];
    }
  };
  const flushList = () => {
    if (list.length) {
      blocks.push(
        <ul key={`l${blocks.length}`} className="list-disc space-y-1 pl-5">
          {list.map((it, i) => (
            <li key={i}>{it}</li>
          ))}
        </ul>,
      );
      list = [];
    }
  };
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (line.startsWith("## ")) {
      flushPara();
      flushList();
      blocks.push(
        <h4 key={`h${blocks.length}`} className="pt-2 text-sm font-semibold uppercase tracking-wider text-accent">
          {line.slice(3)}
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
