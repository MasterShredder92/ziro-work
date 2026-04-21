import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import { headers } from "next/headers";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { requirePermission } from "@/lib/auth/guards";
import { listRolesWithSummary } from "@/lib/admin/roles";
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
export default async function AdminRolesPage({ searchParams, }) {
    const params = await searchParams;
    const tenantId = await resolveTenantId(params);
    const session = await requirePermission("admin.roles.read")();
    const canWrite = session.role === "admin";
    const roles = await listRolesWithSummary(tenantId);
    return (_jsxs("div", { className: "flex flex-col gap-6 p-6", children: [_jsxs("header", { className: "flex flex-wrap items-start justify-between gap-3", children: [_jsxs("div", { children: [_jsx("div", { className: "text-xs uppercase tracking-wider text-[var(--z-muted)]", children: "Admin OS" }), _jsxs("h1", { className: "text-2xl font-bold text-[var(--z-fg)]", children: ["Roles (", roles.length, ")"] }), _jsx("p", { className: "text-sm text-[var(--z-muted)]", children: "System roles are immutable. Custom roles can be tailored per tenant." })] }), canWrite ? (_jsx(Link, { href: `/admin/roles/new?tenantId=${encodeURIComponent(tenantId)}`, className: "h-9 rounded-[var(--z-radius-md)] bg-[var(--z-accent)] px-4 text-sm font-semibold leading-9 text-black", children: "+ New role" })) : null] }), _jsx("div", { className: "overflow-auto rounded-[var(--z-radius-md)] border border-[var(--z-border)]", children: _jsxs("table", { className: "min-w-full border-collapse text-sm", children: [_jsx("thead", { className: "bg-[var(--z-surface)] text-left text-[var(--z-muted)]", children: _jsxs("tr", { children: [_jsx("th", { className: "px-3 py-2", children: "Name" }), _jsx("th", { className: "px-3 py-2", children: "Key" }), _jsx("th", { className: "px-3 py-2", children: "Base" }), _jsx("th", { className: "px-3 py-2", children: "Type" }), _jsx("th", { className: "px-3 py-2", children: "Permissions" }), _jsx("th", { className: "px-3 py-2", children: "Assigned" }), _jsx("th", { className: "px-3 py-2" })] }) }), _jsxs("tbody", { children: [roles.map((r) => {
                                    var _a;
                                    return (_jsxs("tr", { className: "border-t border-[var(--z-border)] hover:bg-white/5", children: [_jsx("td", { className: "px-3 py-2 font-semibold text-[var(--z-fg)]", children: r.role.name }), _jsx("td", { className: "px-3 py-2 font-mono text-xs", children: r.role.key }), _jsx("td", { className: "px-3 py-2 text-xs", children: (_a = r.role.base_role) !== null && _a !== void 0 ? _a : "—" }), _jsx("td", { className: "px-3 py-2 text-xs", children: r.role.is_system ? "system" : "custom" }), _jsx("td", { className: "px-3 py-2 text-xs text-[var(--z-muted)]", children: r.effectivePermissions.length }), _jsx("td", { className: "px-3 py-2 text-xs text-[var(--z-muted)]", children: r.assignedProfileCount }), _jsx("td", { className: "px-3 py-2 text-right", children: _jsx(Link, { href: `/admin/roles/${r.role.id}?tenantId=${encodeURIComponent(tenantId)}`, className: "text-xs text-[var(--z-accent)] hover:underline", children: canWrite && !r.role.is_system ? "Edit" : "View" }) })] }, r.role.id));
                                }), roles.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 7, className: "px-3 py-6 text-center text-[var(--z-muted)]", children: "No roles yet." }) })) : null] })] }) })] }));
}
