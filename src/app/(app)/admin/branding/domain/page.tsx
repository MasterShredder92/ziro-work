import { getBrandingDashboard } from "@/lib/branding";
import type { BrandingContext } from "../guard";
import { resolveBrandingAdminSurfaceContext } from "../guard";
import { resolveBrandingTenantId } from "../tenant";
import { BrandingForbidden } from "../BrandingForbidden";
import { DomainManagerClient } from "../components/DomainManagerClient";

export const dynamic = "force-dynamic";

export default async function DomainManagerPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const tenantId = await resolveBrandingTenantId(params);

  let ctx: BrandingContext | undefined;
  try {
    ctx = await resolveBrandingAdminSurfaceContext({ tenantId });
  } catch {
    ctx = undefined;
  }
  if (!ctx) return <BrandingForbidden variant="compact" />;

  const data = await getBrandingDashboard(ctx.tenantId);
  return (
    <div className="space-y-6">
      <header>
        <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
          Custom domains
        </div>
        <h1 className="text-xl font-semibold text-[var(--z-fg)]">
          CNAME verification & activation
        </h1>
        <p className="text-sm text-[var(--z-muted)]">
          Point your DNS to the verification target, then verify and activate.
        </p>
      </header>
      <DomainManagerClient
        tenantId={ctx.tenantId}
        canWrite={ctx.canWrite}
        domains={data.domains}
      />
    </div>
  );
}
