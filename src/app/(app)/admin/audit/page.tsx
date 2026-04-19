import { headers } from "next/headers";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { requirePermission } from "@/lib/auth/guards";
import { searchAudit } from "@/lib/admin/audit";
import { AuditLogTable } from "../components/AuditLogTable";

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

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const tenantId = await resolveTenantId(params);
  await requirePermission("admin.audit.read")();
  const rows = await searchAudit(tenantId, { limit: 500 });

  return (
    <div className="flex flex-col gap-6 p-6">
      <header>
        <div className="text-xs uppercase tracking-wider text-[var(--z-muted)]">
          Admin OS
        </div>
        <h1 className="text-2xl font-bold text-[var(--z-fg)]">Audit log</h1>
        <p className="text-sm text-[var(--z-muted)]">
          Every privileged action. Settings and role changes include a diff.
        </p>
      </header>

      <AuditLogTable tenantId={tenantId} entries={rows} />
    </div>
  );
}
