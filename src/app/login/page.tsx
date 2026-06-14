import { SiteShell } from "@/components/site/SiteShell";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = {
  title: "Sign in · ONESKY",
  description: "Sign in with a magic link to save your charts.",
};

export default async function LoginPage() {
  return (
    <SiteShell width="max-w-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Welcome back</p>
      <h1 className="mb-2 mt-2 font-display text-3xl font-semibold">Sign in</h1>
      <p className="mb-6 text-sm text-muted">
        Sign in to save your charts. We email you a magic link, so there is no password to remember.
      </p>
      <LoginForm />
    </SiteShell>
  );
}
