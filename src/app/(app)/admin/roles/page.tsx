import Link from "next/link";
import { headers } from "next/headers";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { requirePermission } from "@/lib/auth/guards";
import { listRolesWithSummary } from "@/lib/admin/roles";

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

export default async function AdminRolesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const tenantId = await resolveTenantId(params);
  const session = await requirePermission("admin.roles.read")();
  const canWrite = session.role === "admin";
  const roles = await listRolesWithSummary(tenantId);

  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-[var(--z-muted)]">
            Admin OS
          </div>
          <h1 className="text-2xl font-bold text-[var(--z-fg)]">
            Roles ({roles.length})
          </h1>
          <p className="text-sm text-[var(--z-muted)]">
            System roles are immutable. Custom roles can be tailored per tenant.
          </p>
        </div>
        {canWrite ? (
          <Link
            href={`/admin/roles/new?tenantId=${encodeURIComponent(tenantId)}`}
            className="h-9 rounded-[var(--z-radius-md)] bg-[var(--z-accent)] px-4 text-sm font-semibold leading-9 text-black"
          >
            + New role
          </Link>
        ) : null}
      </header>

      <div className="overflow-auto rounded-[var(--z-radius-md)] border border-[var(--z-border)]">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-[var(--z-surface)] text-left text-[var(--z-muted)]">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Key</th>
              <th className="px-3 py-2">Base</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Permissions</th>
              <th className="px-3 py-2">Assigned</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {roles.map((r) => (
              <tr
                key={r.role.id}
                className="border-t border-[var(--z-border)] hover:bg-white/5"
              >
                <td className="px-3 py-2 font-semibold text-[var(--z-fg)]">
                  {r.role.name}
                </td>
                <td className="px-3 py-2 font-mono text-xs">{r.role.key}</td>
                <td className="px-3 py-2 text-xs">
                  {r.role.base_role ?? "—"}
                </td>
                <td className="px-3 py-2 text-xs">
                  {r.role.is_system ? "system" : "custom"}
                </td>
                <td className="px-3 py-2 text-xs text-[var(--z-muted)]">
                  {r.effectivePermissions.length}
                </td>
                <td className="px-3 py-2 text-xs text-[var(--z-muted)]">
                  {r.assignedProfileCount}
                </td>
                <td className="px-3 py-2 text-right">
                  <Link
                    href={`/admin/roles/${r.role.id}?tenantId=${encodeURIComponent(tenantId)}`}
                    className="text-xs text-[var(--z-accent)] hover:underline"
                  >
                    {canWrite && !r.role.is_system ? "Edit" : "View"}
                  </Link>
                </td>
              </tr>
            ))}
            {roles.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-6 text-center text-[var(--z-muted)]"
                >
                  No roles yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
