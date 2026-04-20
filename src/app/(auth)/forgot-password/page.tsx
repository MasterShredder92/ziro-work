import { headers } from "next/headers";
import { getBrandingProfile } from "@/lib/branding";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Forgot Password · ZiroWork" };

export default async function ForgotPasswordPage() {
  const h = await headers();
  const tenantId = h.get("x-tenant-id")?.trim() || DEFAULT_TENANT_ID;
  const profile = await getBrandingProfile(tenantId);
  const lp = profile?.login_page;
  const bg = lp?.backgroundColor ?? profile?.colors.background ?? "var(--z-bg)";
  const accent = lp?.accentColor ?? profile?.colors.accent ?? "#00ff88";

  return (
    <main
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: bg }}
    >
      <div className="w-full max-w-md space-y-6 rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-8 shadow-xl">
        <div>
          <h1 className="text-xl font-bold text-[var(--z-fg)]">Reset your password</h1>
          <p className="mt-1 text-sm text-[var(--z-muted)]">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>
        </div>
        <div className="h-1 rounded-full" style={{ background: accent }} aria-hidden />
        <ForgotPasswordForm accent={accent} />
      </div>
    </main>
  );
}
