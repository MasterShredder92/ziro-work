import { headers } from "next/headers";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { requirePermission } from "@/lib/auth/guards";
import { listFlags } from "@/lib/admin/features";
import { FeatureFlagsGrid } from "./FeatureFlagsGrid";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function resolveTenantId(
  params: Record<string, string | string[] | undefined>,
): Promise<string> {
  const v = params.tenantId;
  const paramValue = Array.isArray(v) ? v[0] : v;
  if (paramValue && paramValue.trim()) return paramValue.trim();
  const h = await headers();
  const fromHeader = h.get("x-tenant-id");
  if (fromHeader && fromHeader.trim().length > 0) return fromHeader.trim();
  return DEFAULT_TENANT_ID;
}

export default async function AdminFeatureFlagsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const tenantId = await resolveTenantId(params);
  const session = await requirePermission("admin.feature_flags.read")();
  const canWrite = session.role === "admin";
  const flags = await listFlags(tenantId);

  return (
    <div className="flex flex-col gap-6 p-6">
      <header>
        <div className="text-xs uppercase tracking-wider text-[var(--z-muted)]">
          Admin OS
        </div>
        <h1 className="text-2xl font-bold text-[var(--z-fg)]">
          Feature flags
        </h1>
        <p className="text-sm text-[var(--z-muted)]">
          Toggle features on/off per tenant. Rollout percent and targeting apply
          to gradual rollouts.
        </p>
      </header>
      <FeatureFlagsGrid
        tenantId={tenantId}
        initial={flags}
        canWrite={canWrite}
      />
    </div>
  );
}
