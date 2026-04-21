import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
async function resolveTenantId(params) {
    const v = params.tenantId;
    const paramValue = Array.isArray(v) ? v[0] : v;
    if (paramValue && paramValue.trim())
        return paramValue.trim();
    const h = await headers();
    const fromHeader = h.get("x-tenant-id");
    if (fromHeader && fromHeader.trim().length > 0)
        return fromHeader.trim();
    return DEFAULT_TENANT_ID;
}
export default async function AdminRoleDetailPage({ params, searchParams, }) {
    const { id } = await params;
    const query = await searchParams;
    const tenantId = await resolveTenantId(query);
    const session = await requirePermission("admin.roles.read")();
    const canWrite = session.role === "admin";
    const summaries = await listRolesWithSummary(tenantId);
    const allRoles = summaries.map((s) => s.role);
    if (id === "new") {
        if (!canWrite)
            notFound();
        return (_jsxs("div", { className: "flex flex-col gap-6 p-6", children: [_jsxs("header", { children: [_jsx("div", { className: "text-xs uppercase tracking-wider text-[var(--z-muted)]", children: _jsx(Link, { href: `/admin/roles?tenantId=${encodeURIComponent(tenantId)}`, className: "hover:underline", children: "\u2190 All roles" }) }), _jsx("h1", { className: "text-2xl font-bold text-[var(--z-fg)]", children: "New role" })] }), _jsx(RoleEditor, { tenantId: tenantId, initial: null, bundles: PERMISSION_BUNDLES, availableRoles: allRoles, canWrite: canWrite })] }));
    }
    const summary = summaries.find((s) => s.role.id === id);
    if (!summary)
        notFound();
    return (_jsxs("div", { className: "flex flex-col gap-6 p-6", children: [_jsxs("header", { className: "flex flex-col gap-1", children: [_jsx("div", { className: "text-xs uppercase tracking-wider text-[var(--z-muted)]", children: _jsx(Link, { href: `/admin/roles?tenantId=${encodeURIComponent(tenantId)}`, className: "hover:underline", children: "\u2190 All roles" }) }), _jsxs("h1", { className: "text-2xl font-bold text-[var(--z-fg)]", children: [summary.role.name, _jsx("span", { className: "ml-2 text-xs font-normal text-[var(--z-muted)]", children: summary.role.is_system ? "system" : "custom" })] }), _jsxs("div", { className: "flex items-center gap-3 text-xs text-[var(--z-muted)]", children: [_jsxs("span", { children: ["Key: ", summary.role.key] }), _jsxs("span", { children: ["Permissions: ", summary.effectivePermissions.length] }), _jsxs("span", { children: ["Assigned profiles: ", summary.assignedProfileCount] })] })] }), _jsx(RoleEditor, { tenantId: tenantId, initial: summary.role, bundles: PERMISSION_BUNDLES, availableRoles: allRoles, canWrite: canWrite })] }));
}
