import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { headers } from "next/headers";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { requirePermission } from "@/lib/auth/guards";
import { getTenantProfile, readSettings } from "@/lib/admin/settings";
import { TenantBrandingForm } from "../components/TenantBrandingForm";
import { TenantSettingsForm } from "./TenantSettingsForm";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
async function resolveTenantId(searchParams) {
    const fromParam = searchParams.tenantId;
    const paramValue = Array.isArray(fromParam) ? fromParam[0] : fromParam;
    if (paramValue && paramValue.trim().length > 0)
        return paramValue.trim();
    const h = await headers();
    const fromHeader = h.get("x-tenant-id");
    if (fromHeader && fromHeader.trim().length > 0)
        return fromHeader.trim();
    return DEFAULT_TENANT_ID;
}
export default async function AdminSettingsPage({ searchParams, }) {
    const params = await searchParams;
    const tenantId = await resolveTenantId(params);
    const session = await requirePermission("admin.settings.read")();
    const canWrite = session.role === "admin";
    const [tenant, settings] = await Promise.all([
        getTenantProfile(tenantId),
        readSettings(tenantId),
    ]);
    return (_jsxs("div", { className: "flex flex-col gap-6 p-6", children: [_jsxs("header", { className: "flex flex-col gap-1", children: [_jsx("div", { className: "text-xs uppercase tracking-wider text-[var(--z-muted)]", children: "Admin OS" }), _jsx("h1", { className: "text-2xl font-bold text-[var(--z-fg)]", children: "Tenant settings" }), _jsxs("p", { className: "text-sm text-[var(--z-muted)]", children: ["Branding, locale, and per-OS configuration for this tenant.", canWrite ? null : " Read-only for directors."] })] }), _jsxs("section", { className: "flex flex-col gap-3 rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4", children: [_jsx("h2", { className: "text-lg font-semibold text-[var(--z-fg)]", children: "Branding" }), _jsx(TenantBrandingForm, { tenantId: tenantId, tenant: tenant, canWrite: canWrite })] }), _jsxs("section", { className: "flex flex-col gap-3 rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4", children: [_jsx("h2", { className: "text-lg font-semibold text-[var(--z-fg)]", children: "Operational settings" }), _jsx(TenantSettingsForm, { tenantId: tenantId, settings: settings, canWrite: canWrite })] })] }));
}
