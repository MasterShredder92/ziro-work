import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { assertTenantAccess, requirePermission } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
import { getSavedReport } from "@/lib/reports/savedReports";
import { runQuery } from "@/lib/reports/queryEngine";
import { PivotTable } from "../../components/charts/PivotTable";
import { SavedReportActions } from "../../components/SavedReportActions";
import { WidgetRenderer } from "../../components/WidgetRenderer";
export const dynamic = "force-dynamic";
export default async function SavedReportViewer({ params, }) {
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
            session = null;
        }
    }
    const loaded = await getSavedReport(id, tenantId).catch(() => null);
    if (!loaded)
        notFound();
    const { report, widgets } = loaded;
    const preview = report.query
        ? await runQuery(report.query, tenantId).catch(() => null)
        : null;
    await logAudit("reports.viewer.saved", {
        tenantId,
        profileId: (_b = session === null || session === void 0 ? void 0 : session.userId) !== null && _b !== void 0 ? _b : null,
        reportId: report.id,
        widgets: widgets.length,
    });
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("section", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center gap-2 text-[11px] text-[var(--z-muted)]", children: [_jsx(Link, { href: "/reports", className: "hover:text-[var(--z-fg)] transition-colors", children: "Reports" }), _jsx("span", { "aria-hidden": true, children: "/" }), _jsx("span", { className: "text-[var(--z-fg)]", children: report.name })] }), _jsxs("div", { className: "flex items-start justify-between gap-4 flex-wrap", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-xl sm:text-2xl font-semibold text-[var(--z-fg)]", children: report.name }), report.description ? (_jsx("p", { className: "text-sm text-[var(--z-muted)] max-w-[720px]", children: report.description })) : null] }), _jsx(SavedReportActions, { report: report, tenantId: tenantId })] })] }), widgets.length > 0 ? (_jsx("section", { className: "grid gap-4 md:grid-cols-2", children: widgets.map((w) => (_jsx(WidgetRenderer, { widget: w, tenantId: tenantId }, w.id))) })) : null, preview ? (_jsxs("section", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h2", { className: "text-sm font-semibold text-[var(--z-fg)]", children: "Data preview" }), _jsxs("span", { className: "text-[11px] text-[var(--z-muted)]", children: [preview.rows.length, " of ", preview.totalRows, " rows \u00B7 ", preview.durationMs, "ms"] })] }), _jsx(PivotTable, { columns: preview.columns, rows: preview.rows })] })) : (_jsx("div", { className: "rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-8 text-center text-sm text-[var(--z-muted)]", children: "This report has no query configured yet." }))] }));
}
