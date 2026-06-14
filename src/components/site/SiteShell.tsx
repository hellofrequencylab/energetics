import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";

/**
 * Standard page chrome: the shared header, a centered main column, and the shared
 * footer, on the single app background. Server component (the header reads auth).
 * Pass `width` for the main column and `main={false}` for pages that lay out
 * their own main element.
 */
export async function SiteShell({
  children,
  width = "max-w-5xl",
  main = true,
}: {
  children: React.ReactNode;
  width?: string;
  main?: boolean;
}) {
  return (
    <div className="flex min-h-screen flex-col text-foreground">
      <SiteHeader />
      {main ? (
        <main className={`mx-auto w-full flex-1 px-5 py-10 sm:py-14 ${width}`}>{children}</main>
      ) : (
        <div className="flex-1">{children}</div>
      )}
      <SiteFooter />
    </div>
  );
}
