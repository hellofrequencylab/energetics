import type { ReactNode } from "react";
import { cn } from "@/lib/ui/cn";
import { CONTAINER } from "@/components/ui/Container";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";

/**
 * Standard page chrome: the shared header, an optional section sub-nav, a centered
 * main column at the one uniform site width, and the shared footer. Server
 * component (the header reads auth).
 *
 * Every page uses the same container width (see CONTAINER). The legacy `width`
 * prop is accepted but ignored so older call sites keep compiling; pass `nav` to
 * show the role-aware section sub-nav, and `main={false}` for pages that lay out
 * their own main element.
 */
export async function SiteShell({
  children,
  nav,
  main = true,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  width,
}: {
  children: ReactNode;
  nav?: ReactNode;
  main?: boolean;
  width?: string;
}) {
  return (
    <div className="flex min-h-screen flex-col text-foreground">
      <SiteHeader />
      {nav && (
        <div className="sticky top-[57px] z-30 border-b border-border bg-midnight/70 backdrop-blur">
          <div className={CONTAINER}>{nav}</div>
        </div>
      )}
      {main ? (
        <main className={cn(CONTAINER, "flex-1 py-10 sm:py-14")}>{children}</main>
      ) : (
        <div className="flex-1">{children}</div>
      )}
      <SiteFooter />
    </div>
  );
}
