import { cn } from "@/lib/ui/cn";

/** A hairline rule using the token border color. */
export function Divider({ className }: { className?: string }) {
  return <hr className={cn("border-0 border-t border-border/60", className)} />;
}
