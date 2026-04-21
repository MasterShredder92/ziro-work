import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { notFound } from "next/navigation";
import Link from "next/link";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { assertTenantAccess, requirePermission } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";
import { logAudit } from "@/lib/audit/log";
import { getInventoryItemSurface } from "@/lib/inventory/service";
import { CheckoutForm, CheckoutList, DepreciationCurve, InventoryDetail, MaintenanceForm, MaintenanceList, StockList, } from "../components";
export const dynamic = "force-dynamic";
function Kpi({ label, value, sublabel, accent, }) {
    return (_jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4", children: [_jsx("div", { className: "text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: label }), _jsx("div", { className: `mt-1 text-2xl font-bold ${accent !== null && accent !== void 0 ? accent : "text-[var(--z-fg)]"}`, children: value }), sublabel ? (_jsx("div", { className: "mt-0.5 text-[11px] text-[var(--z-muted)]", children: sublabel })) : null] }));
}
export default async function InventoryItemPage({ params, }) {
    var _a;
    const { id } = await params;
    let session;
    try {
        session = await requirePermission("inventory.read")();
    }
    catch (_b) {
        return (_jsx("div", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-8 text-center", children: _jsx("div", { className: "text-base font-semibold text-[var(--z-fg)]", children: "Forbidden" }) }));
    }
    const tenantId = (_a = session.tenantId) !== null && _a !== void 0 ? _a : DEFAULT_TENANT_ID;
    try {
        await assertTenantAccess(tenantId);
    }
    catch (_c) {
        return (_jsx("div", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-8 text-center", children: _jsx("div", { className: "text-base font-semibold text-[var(--z-fg)]", children: "Forbidden" }) }));
    }
    const surface = await getInventoryItemSurface(id, tenantId);
    if (!surface)
        notFound();
    const canWrite = hasPermission(session.role, "inventory.write");
    await logAudit("inventory.item.view", {
        tenantId,
        profileId: session.userId,
        itemId: id,
        source: "page",
    });
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("div", { children: _jsx(Link, { href: "/inventory", className: "text-xs font-medium text-[var(--z-muted)] hover:text-[var(--z-fg)]", children: "\u2190 All inventory" }) }), _jsx(InventoryDetail, { surface: surface }), _jsxs("section", { id: "overview", className: "grid grid-cols-2 gap-3 md:grid-cols-4", children: [_jsx(Kpi, { label: "On hand", value: surface.kpis.totalOnHand, sublabel: `${surface.kpis.totalReserved} reserved` }), _jsx(Kpi, { label: "Active checkouts", value: surface.kpis.activeCheckouts, sublabel: `${surface.kpis.overdueCheckouts} overdue`, accent: surface.kpis.overdueCheckouts > 0 ? "text-rose-300" : undefined }), _jsx(Kpi, { label: "Open maintenance", value: surface.kpis.openMaintenance, accent: surface.kpis.openMaintenance > 0 ? "text-amber-300" : undefined }), _jsx(Kpi, { label: "% value remaining", value: `${surface.depreciation.percentRemaining}%`, sublabel: `${surface.depreciation.monthsElapsed} mo elapsed`, accent: "text-[#00ff88]" })] }), _jsx("section", { id: "depreciation", children: _jsx(DepreciationCurve, { record: surface.depreciation }) }), _jsxs("section", { id: "stock", className: "space-y-2", children: [_jsx("h2", { className: "text-base font-semibold text-[var(--z-fg)]", children: "Stock" }), _jsx(StockList, { stock: surface.stock })] }), _jsxs("section", { id: "checkouts", className: "space-y-3", children: [_jsx("h2", { className: "text-base font-semibold text-[var(--z-fg)]", children: "Checkouts" }), _jsx(CheckoutList, { checkouts: surface.checkouts, maxRows: 25 }), canWrite ? _jsx(CheckoutForm, { itemId: surface.item.id }) : null] }), _jsxs("section", { id: "maintenance", className: "space-y-3", children: [_jsx("h2", { className: "text-base font-semibold text-[var(--z-fg)]", children: "Maintenance log" }), _jsx(MaintenanceList, { maintenance: surface.maintenance, maxRows: 25 }), canWrite ? _jsx(MaintenanceForm, { itemId: surface.item.id }) : null] })] }));
}
