"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/** Magic-link sign-in form. Requests an OTP link to the entered email. */
export function LoginForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  const supabase = createClient();

  // Surface a failed callback so a bad or expired link is not silent.
  useEffect(() => {
    if (!new URLSearchParams(window.location.search).get("error")) return;
    const id = requestAnimationFrame(() => {
      setStatus("error");
      setMessage(
        "That sign-in link did not work. Request a new one below and open it on this same device.",
      );
    });
    return () => cancelAnimationFrame(id);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) {
      setStatus("error");
      setMessage("Auth is not configured. Set NEXT_PUBLIC_SUPABASE_URL and _ANON_KEY.");
      return;
    }
    setStatus("sending");
    const next =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("next") || "/account"
        : "/account";
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
            : undefined,
      },
    });
    if (error) {
      setStatus("error");
      setMessage(error.message);
    } else {
      setStatus("sent");
      setMessage("Check your email for a magic sign-in link.");
    }
  }

  return (
    <>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-lg border border-border bg-surface/60 px-3 py-2.5 text-sm outline-none transition focus:border-accent"
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className="w-full rounded-lg bg-accent px-4 py-2.5 font-semibold text-ink [text-shadow:0_1px_0_rgba(255,255,255,0.45)] transition hover:brightness-110 disabled:opacity-50"
        >
          {status === "sending" ? "Sending…" : "Send magic link"}
        </button>
      </form>
      {message && (
        <p className={`mt-4 text-sm ${status === "error" ? "text-red-300" : "text-muted"}`}>{message}</p>
      )}
    </>
  );
}
