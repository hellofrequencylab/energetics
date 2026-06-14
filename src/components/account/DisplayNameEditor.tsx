"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Field, Input, Button } from "@/components/ui";

/** Edit the profile display name. Posts to /api/profile (partial-safe). */
export function DisplayNameEditor({ initial }: { initial: string }) {
  const router = useRouter();
  const [name, setName] = useState(initial);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

  async function save() {
    setStatus("saving");
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ displayName: name }),
      });
      setStatus(res.ok ? "saved" : "idle");
      if (res.ok) router.refresh();
    } catch {
      setStatus("idle");
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <Field label="Display name" htmlFor="display-name" className="w-56">
        <Input
          id="display-name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setStatus("idle");
          }}
          placeholder="Your name"
        />
      </Field>
      <Button
        type="button"
        variant="secondary"
        onClick={save}
        disabled={status === "saving"}
      >
        {status === "saving" ? "Saving…" : status === "saved" ? "Saved" : "Save"}
      </Button>
    </div>
  );
}
