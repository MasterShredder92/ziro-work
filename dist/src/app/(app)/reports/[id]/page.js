import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { notFound } from "next/navigation";
import Link from "next/link";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { logAudit } from "@/lib/audit/log";
import { assertTenantAccess, requirePermission } from "@/lib/auth/guards";
import { getReportDefinition } from "@/lib/reports/service";
import { ReportRunner } from "../components/ReportRunner";
export const dynamic = "force-dynamic";
export default async function ReportSurfacePage({ params, }) {
    var _a, _b;
    const { id } = await params;
    let session = null;
    try {
        session = await requirePermission("reports.read")();
    }
    catch (_c) {
        session = null;
    }
    const tenantId = (_a = session === null || session === void 0 ? void 0 : session.tenantId) !== null && _a !== void 0 ? _a : DEFAULT_TENANT_ID;
    if (session) {
        try {
            await assertTenantAccess(tenantId);
        }
        catch (_d) {
            return (_jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center", children: [_jsx("div", { className: "text-base font-semibold text-[var(--z-fg)]", children: "Forbidden" }), _jsx("div", { className: "mt-2 text-sm text-[var(--z-muted)]", children: "You do not have access to this tenant's reports." })] }));
        }
    }
    const definition = await getReportDefinition(id);
    if (!definition) {
        notFound();
    }
    await logAudit("reports.surface.view", {
        reportId: definition.id,
        tenantId,
        profileId: (_b = session === null || session === void 0 ? void 0 : session.userId) !== null && _b !== void 0 ? _b : null,
    });
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("section", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center gap-2 text-[11px] text-[var(--z-muted)]", children: [_jsx(Link, { href: "/reports", className: "hover:text-[var(--z-fg)] transition-colors", children: "Reports" }), _jsx("span", { "aria-hidden": true, children: "/" }), _jsx("span", { className: "text-[var(--z-fg)]", children: definition.name })] }), _jsx("h1", { className: "text-xl sm:text-2xl font-semibold text-[var(--z-fg)]", children: definition.name }), _jsx("p", { className: "text-sm text-[var(--z-muted)] max-w-[720px]", children: definition.description })] }), _jsx(ReportRunner, { definition: definition, tenantId: tenantId })] }));
}
