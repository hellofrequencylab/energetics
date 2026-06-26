"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Field, Input, Button } from "@/components/ui";
import { cn } from "@/lib/ui/cn";

/**
 * Change your password while signed in. Uses Supabase `updateUser`, which sets a
 * new password on the current session. It also lets an account created with a
 * magic link add a password for the first time.
 */
export function ChangePasswordForm() {
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    if (password !== confirm) {
      setNotice({ kind: "error", text: "The two passwords do not match." });
      return;
    }
    setBusy(true);
    setNotice(null);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      setNotice({ kind: "error", text: error.message });
      return;
    }
    setPassword("");
    setConfirm("");
    setNotice({ kind: "ok", text: "Password updated. Use the new one next time you sign in." });
  }

  if (!supabase) {
    return <p className="text-sm text-muted">Accounts are not configured yet.</p>;
  }

  return (
    <form onSubmit={onSubmit} className="max-w-sm space-y-3">
      <Field label="New password" htmlFor="change-password" hint="At least 8 characters.">
        <Input
          id="change-password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setNotice(null);
          }}
          placeholder="••••••••"
        />
      </Field>
      <Field label="Confirm new password" htmlFor="change-password-confirm">
        <Input
          id="change-password-confirm"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => {
            setConfirm(e.target.value);
            setNotice(null);
          }}
          placeholder="••••••••"
        />
      </Field>
      <Button type="submit" variant="secondary" disabled={busy}>
        {busy ? "Saving…" : "Update password"}
      </Button>
      {notice && (
        <p className={cn("text-sm", notice.kind === "error" ? "text-red-300" : "text-accent")}>
          {notice.text}
        </p>
      )}
    </form>
  );
}
