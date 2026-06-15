import type { Metadata } from "next";
import { SiteShell } from "@/components/site/SiteShell";
import { PageHeader } from "@/components/ui";
import { StyleguideClient } from "./StyleguideClient";

export const metadata: Metadata = {
  title: "Style guide",
  description: "The living reference for the OneSky UI kit: tokens, type, and primitives.",
  robots: { index: false, follow: false },
};

/**
 * The living style guide. A self-documenting reference for the design system, so
 * primitives stay consistent and are easy to extend. The rules behind it live in
 * docs/DESIGN.md.
 */
export default function StyleguidePage() {
  return (
    <SiteShell>
      <PageHeader
        eyebrow="Design system"
        title="Style guide"
        description="The building blocks of OneSky: color tokens, type, and the shared UI primitives every page is made from."
      />
      <StyleguideClient />
    </SiteShell>
  );
}
