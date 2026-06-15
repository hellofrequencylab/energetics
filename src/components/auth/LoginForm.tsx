"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button, Field, Input } from "@/components/ui";
import { cn } from "@/lib/ui/cn";
import { safeNextPath } from "@/lib/auth/safe-next";
import { Turnstile, turnstileSiteKey } from "@/components/auth/Turnstile";
import { FREE_LIMITS } from "@/lib/billing/plans";

type Method = "password" | "magic";
type Mode = "signin" | "signup";
type Notice = { kind: "ok" | "error" | "info"; text: string } | null;

/** Where to land after auth (defaults to the account). Sanitized to a same-site
 *  path so a crafted ?next= can never redirect off-origin. */
function nextParam(): string {
  if (typeof window === "undefined") return "/account";
  return safeNextPath(new URLSearchParams(window.location.search).get("next"));
}
/** The PKCE callback URL that completes an emailed link, then sends on to `next`. */
function callbackUrl(next: string): string {
  return `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
}

/**
 * The sign-in surface. Two methods: a password (sign in or create an account) and
 * a one-time magic link by email. Includes a password reset, which emails a link
 * back through /auth/callback to /reset-password.
 */
export function LoginForm() {
  const [method, setMethod] = useState<Method>("password");
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [captcha, setCaptcha] = useState<string | null>(null);

  const supabase = createClient();
  const onToken = useCallback((t: string | null) => setCaptcha(t), []);

  // Surface a failed callback so a bad or expired link is not silent.
  useEffect(() => {
    if (!new URLSearchParams(window.location.search).get("error")) return;
    const id = requestAnimationFrame(() =>
      setNotice({
        kind: "error",
        text: "That sign-in link did not work. Request a new one and open it on this same device.",
      }),
    );
    return () => cancelAnimationFrame(id);
  }, []);

  function client() {
    if (!supabase) {
      setNotice({ kind: "error", text: "Sign in is not configured yet. Set NEXT_PUBLIC_SUPABASE_URL and _ANON_KEY." });
      return null;
    }
    return supabase;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const sb = client();
    if (!sb) return;
    setBusy(true);
    setNotice(null);
    const next = nextParam();
    try {
      if (method === "magic") {
        const { error } = await sb.auth.signInWithOtp({
          email: email.trim(),
          options: { emailRedirectTo: callbackUrl(next) },
        });
        if (error) throw error;
        setNotice({ kind: "ok", text: "Check your email for a magic sign-in link." });
      } else if (mode === "signin") {
        const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        window.location.assign(next);
        return;
      } else {
        const { data, error } = await sb.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: callbackUrl(next) },
        });
        if (error) throw error;
        // With email confirmation on, there is no session yet; otherwise we are in.
        if (data.session) {
          window.location.assign(next);
          return;
        }
        setNotice({ kind: "ok", text: "Check your email to confirm your account, then come back and sign in." });
      }
    } catch (err) {
      setNotice({ kind: "error", text: err instanceof Error ? err.message : "Something went wrong." });
    } finally {
      setBusy(false);
    }
  }

  async function onForgot() {
    const sb = client();
    if (!sb) return;
    if (!email.trim()) {
      setNotice({ kind: "error", text: "Enter your email above first, then choose forgot password." });
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      const { error } = await sb.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: callbackUrl("/reset-password"),
      });
      if (error) throw error;
      setNotice({ kind: "ok", text: "Check your email for a link to set a new password." });
    } catch (err) {
      setNotice({ kind: "error", text: err instanceof Error ? err.message : "Something went wrong." });
    } finally {
      setBusy(false);
    }
  }

  async function onGuest() {
    const sb = client();
    if (!sb) return;
    if (turnstileSiteKey() && !captcha) {
      setNotice({ kind: "error", text: "Please complete the human check first." });
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      const { error } = await sb.auth.signInAnonymously(captcha ? { options: { captchaToken: captcha } } : undefined);
      if (error) throw error;
      window.location.assign(nextParam());
    } catch (err) {
      setNotice({ kind: "error", text: err instanceof Error ? err.message : "Could not continue as guest." });
      setBusy(false);
    }
  }

  const tab = (m: Method, label: string) => (
    <button
      type="button"
      aria-pressed={method === m}
      onClick={() => {
        setMethod(m);
        setNotice(null);
      }}
      className={cn(
        "flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition",
        method === m ? "bg-accent text-ink" : "text-muted hover:text-foreground",
      )}
    >
      {label}
    </button>
  );

  return (
    <div>
      <div className="mb-5 inline-flex w-full rounded-xl border border-border p-1">
        {tab("password", "Password")}
        {tab("magic", "Magic link")}
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        <Field label="Email" htmlFor="email">
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </Field>

        {method === "password" && (
          <Field label="Password" htmlFor="password" hint={mode === "signup" ? "At least 8 characters." : undefined}>
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </Field>
        )}

        <Button type="submit" variant="primary" size="lg" disabled={busy} className="w-full">
          {busy ? "Working…" : method === "magic" ? "Send magic link" : mode === "signin" ? "Sign in" : "Create account"}
        </Button>
      </form>

      {method === "password" && (
        <div className="mt-3 flex items-center justify-between gap-3 text-sm">
          <button
            type="button"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setNotice(null);
            }}
            className="text-accent transition hover:underline"
          >
            {mode === "signin" ? "Create an account" : "I already have an account"}
          </button>
          {mode === "signin" && (
            <button type="button" onClick={onForgot} className="text-muted transition hover:text-foreground">
              Forgot password?
            </button>
          )}
        </div>
      )}

      <div className="mt-5 border-t border-border pt-4">
        <p className="text-xs leading-relaxed text-muted">
          Want to look first? Continue without an account. You can save up to {FREE_LIMITS.savedCharts} charts, and add
          your email later to keep them. Your birth data stays yours.
        </p>
        <Turnstile onToken={onToken} />
        <Button
          type="button"
          variant="secondary"
          size="lg"
          disabled={busy}
          className="mt-3 w-full"
          onClick={onGuest}
        >
          Continue as guest
        </Button>
      </div>

      {notice && (
        <p
          className={cn(
            "mt-4 text-sm",
            notice.kind === "error" ? "text-red-300" : notice.kind === "ok" ? "text-accent" : "text-muted",
          )}
        >
          {notice.text}
        </p>
      )}
    </div>
  );
}
