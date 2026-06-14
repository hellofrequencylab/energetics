/**
 * Tiny classname combiner (clsx-style) with no dependency. Flattens arrays and
 * drops falsy values so component variants can compose conditionally:
 *   cn("base", isActive && "active", className)
 * It does not de-duplicate conflicting Tailwind utilities, so variant maps below
 * are written to not overlap.
 */
export type ClassValue = string | number | false | null | undefined | ClassValue[];

export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];
  const walk = (v: ClassValue) => {
    if (v === 0) {
      out.push("0");
      return;
    }
    if (!v) return;
    if (Array.isArray(v)) v.forEach(walk);
    else out.push(String(v));
  };
  inputs.forEach(walk);
  return out.join(" ");
}
