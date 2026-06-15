"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button, Field, Input } from "@/components/ui";
import { cn } from "@/lib/ui/cn";

/**
 * Set a new password. Reached from the reset email: /auth/callback establishes a
 * recovery session, then sends the user here, where `updateUser` saves the new
 * password. Without a session (opened directly), it asks the user to use the link.
 */
export function ResetPasswordForm() {
  const supabase = createClient();
  const [ready, setReady] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!supabase) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReady(false);
      return;
    }
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setReady(Boolean(data.session));
    });
    return () => {
      active = false;
    };
  }, [supabase]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setNotice(null);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setNotice({ kind: "error", text: error.message });
      setBusy(false);
      return;
    }
    setNotice({ kind: "ok", text: "Password updated. Taking you to your account." });
    setTimeout(() => window.location.assign("/account"), 900);
  }

  if (ready === false) {
    return (
      <p className="text-sm text-muted">
        Open the reset link from your email to set a new password. If it has expired, request a new one
        from the sign-in page.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Field label="New password" htmlFor="new-password" hint="At least 8 characters.">
        <Input
          id="new-password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
      </Field>
      <Button type="submit" variant="primary" size="lg" disabled={busy || ready === null} className="w-full">
        {busy ? "Saving…" : "Set new password"}
      </Button>
      {notice && (
        <p className={cn("text-sm", notice.kind === "error" ? "text-red-300" : "text-accent")}>{notice.text}</p>
      )}
    </form>
  );
}
