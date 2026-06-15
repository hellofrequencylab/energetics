import { SiteShell } from "@/components/site/SiteShell";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata = {
  title: "Set a new password · ONESKY",
  description: "Choose a new password for your OneSky account.",
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return (
    <SiteShell>
      <div className="mx-auto max-w-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Your account</p>
        <h1 className="mb-2 mt-2 font-display text-3xl font-semibold">Set a new password</h1>
        <p className="mb-6 text-sm text-muted">Choose a new password, then we will take you to your account.</p>
        <ResetPasswordForm />
      </div>
    </SiteShell>
  );
}
