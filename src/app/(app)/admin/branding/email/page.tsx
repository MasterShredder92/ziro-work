import { getBrandingDashboard } from "@/lib/branding";
import type { BrandingContext } from "../guard";
import { resolveBrandingContext } from "../guard";
import { resolveBrandingTenantId } from "../tenant";
import { BrandingForbidden } from "../BrandingForbidden";
import { EmailIdentityClient } from "../components/EmailIdentityClient";

export const dynamic = "force-dynamic";

export default async function EmailIdentityPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const tenantId = await resolveBrandingTenantId(params);

  let ctx: BrandingContext | undefined;
  try {
    ctx = await resolveBrandingContext({ tenantId });
  } catch {
    ctx = undefined;
  }
  if (!ctx) return <BrandingForbidden variant="compact" />;

  const data = await getBrandingDashboard(ctx.tenantId);
  const primary = data.primaryEmailIdentity ?? data.emailIdentities[0] ?? null;

  return (
    <div className="space-y-6">
      <header>
        <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
          Email identity
        </div>
        <h1 className="text-xl font-semibold text-[var(--z-fg)]">
          From name, from address, reply-to
        </h1>
        <p className="text-sm text-[var(--z-muted)]">
          Used by Messaging OS for outbound email deliveries (metadata stub).
        </p>
      </header>
      <EmailIdentityClient
        tenantId={ctx.tenantId}
        canWrite={ctx.canWrite}
        identity={primary}
      />
    </div>
  );
}
