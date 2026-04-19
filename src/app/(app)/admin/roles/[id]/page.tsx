import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { requirePermission } from "@/lib/auth/guards";
import { listRolesWithSummary } from "@/lib/admin/roles";
import { PERMISSION_BUNDLES } from "@/lib/admin/permissionBundles";
import { RoleEditor } from "../../components/RoleEditor";

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

export default async function AdminRoleDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const tenantId = await resolveTenantId(query);
  const session = await requirePermission("admin.roles.read")();
  const canWrite = session.role === "admin";
  const summaries = await listRolesWithSummary(tenantId);
  const allRoles = summaries.map((s) => s.role);

  if (id === "new") {
    if (!canWrite) notFound();
    return (
      <div className="flex flex-col gap-6 p-6">
        <header>
          <div className="text-xs uppercase tracking-wider text-[var(--z-muted)]">
            <Link
              href={`/admin/roles?tenantId=${encodeURIComponent(tenantId)}`}
              className="hover:underline"
            >
              ← All roles
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-[var(--z-fg)]">New role</h1>
        </header>
        <RoleEditor
          tenantId={tenantId}
          initial={null}
          bundles={PERMISSION_BUNDLES}
          availableRoles={allRoles}
          canWrite={canWrite}
        />
      </div>
    );
  }

  const summary = summaries.find((s) => s.role.id === id);
  if (!summary) notFound();

  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <div className="text-xs uppercase tracking-wider text-[var(--z-muted)]">
          <Link
            href={`/admin/roles?tenantId=${encodeURIComponent(tenantId)}`}
            className="hover:underline"
          >
            ← All roles
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-[var(--z-fg)]">
          {summary.role.name}
          <span className="ml-2 text-xs font-normal text-[var(--z-muted)]">
            {summary.role.is_system ? "system" : "custom"}
          </span>
        </h1>
        <div className="flex items-center gap-3 text-xs text-[var(--z-muted)]">
          <span>Key: {summary.role.key}</span>
          <span>Permissions: {summary.effectivePermissions.length}</span>
          <span>Assigned profiles: {summary.assignedProfileCount}</span>
        </div>
      </header>

      <RoleEditor
        tenantId={tenantId}
        initial={summary.role}
        bundles={PERMISSION_BUNDLES}
        availableRoles={allRoles}
        canWrite={canWrite}
      />
    </div>
  );
}
