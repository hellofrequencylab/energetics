import { SiteShell } from "@/components/site/SiteShell";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = {
  title: "Sign in · ONESKY",
  description: "Sign in or create an account with a password or a one-time magic link.",
};

export default async function LoginPage() {
  return (
    <SiteShell>
      <div className="mx-auto max-w-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Welcome</p>
        <h1 className="mb-2 mt-2 font-display text-3xl font-semibold">Sign in or create an account</h1>
        <p className="mb-6 text-sm text-muted">
          Save your charts and read them anytime. Use a password, or get a one-time magic link by email.
          Your birth data stays yours.
        </p>
        <LoginForm />
      </div>
    </SiteShell>
  );
}
