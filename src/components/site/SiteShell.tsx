import type { ReactNode } from "react";
import { cn } from "@/lib/ui/cn";
import { CONTAINER } from "@/components/ui/Container";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { MobileTabBar } from "./MobileTabBar";
import { getNavRole } from "./role";

/**
 * Standard page chrome: the shared header, an optional section sub-nav, a centered
 * main column at the one uniform site width, and the shared footer. Server
 * component. The viewer's nav role is read once here and shared with the header and
 * footer, so the role-based menus stay consistent without reading auth twice.
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
  const role = await getNavRole();
  return (
    <div className={cn("flex min-h-screen flex-col text-foreground", role.signedIn && "pb-16 sm:pb-0")}>
      <SiteHeader role={role} />
      {nav && (
        <div className="sticky top-0 z-30 border-b border-border bg-midnight/70 backdrop-blur sm:top-[57px]">
          <div className={CONTAINER}>{nav}</div>
        </div>
      )}
      {main ? (
        <main id="main" className={cn(CONTAINER, "flex-1 py-10 sm:py-14")}>{children}</main>
      ) : (
        <div className="flex-1">{children}</div>
      )}
      <SiteFooter role={role} />
      {role.signedIn && <MobileTabBar />}
    </div>
  );
}
