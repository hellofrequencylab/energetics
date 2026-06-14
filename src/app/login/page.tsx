"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
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
    <main className="mx-auto w-full max-w-sm px-5 py-20">
      <h1 className="mb-2 text-2xl font-bold">Sign in</h1>
      <p className="mb-6 text-sm text-muted">
        Sign in to save charts. A magic link will be emailed to you.
      </p>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className="w-full rounded-lg bg-accent px-4 py-2.5 font-semibold text-[#1a1410] transition hover:brightness-110 disabled:opacity-50"
        >
          {status === "sending" ? "Sending…" : "Send magic link"}
        </button>
      </form>
      {message && (
        <p className={`mt-4 text-sm ${status === "error" ? "text-red-300" : "text-muted"}`}>{message}</p>
      )}
    </main>
  );
}
