/**
 * One source of truth for the site menus. The header and the footer both build
 * their links from here, so the navigation is identical on every page and changes
 * in one place. Every menu is role based: public product links for everyone, an
 * Admin link for admins, and an account area that depends on whether you are
 * signed in.
 */
export interface NavRole {
  signedIn: boolean;
  isAdmin: boolean;
}

export interface NavItem {
  href: string;
  label: string;
}

/** Public product links, shown to everyone. */
export const PRODUCT_NAV: NavItem[] = [
  { href: "/synastry", label: "Resonance" },
  { href: "/glossary", label: "Glossary" },
  { href: "/help", label: "Help" },
  { href: "/about", label: "About" },
];

/** Header links by role: the product links, plus Admin for admins. */
export function headerNav(role: NavRole): NavItem[] {
  return role.isAdmin ? [...PRODUCT_NAV, { href: "/admin/systems", label: "Admin" }] : PRODUCT_NAV;
}

/** Footer "Your account" column by role. */
export function accountNav(role: NavRole): NavItem[] {
  if (!role.signedIn) return [{ href: "/login", label: "Sign in" }];
  const items: NavItem[] = [{ href: "/account", label: "Your charts" }];
  if (role.isAdmin) items.push({ href: "/admin/systems", label: "Admin" });
  return items;
}
