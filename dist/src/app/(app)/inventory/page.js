import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { assertTenantAccess, requirePermission } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
import { getInventoryDashboard } from "@/lib/inventory/service";
import { CheckoutList, InventoryList, MaintenanceList, } from "./components";
export const dynamic = "force-dynamic";
function Kpi({ label, value, sublabel, accent, }) {
    return (_jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4", children: [_jsx("div", { className: "text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: label }), _jsx("div", { className: `mt-1 text-2xl font-bold ${accent !== null && accent !== void 0 ? accent : "text-[var(--z-fg)]"}`, children: value }), sublabel ? (_jsx("div", { className: "mt-0.5 text-[11px] text-[var(--z-muted)]", children: sublabel })) : null] }));
}
function formatCurrency(value) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    }).format(value);
}
export default async function InventoryDashboardPage() {
    var _a;
    let session;
    try {
        session = await requirePermission("inventory.read")();
    }
    catch (_b) {
        return (_jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-8 text-center", children: [_jsx("div", { className: "text-base font-semibold text-[var(--z-fg)]", children: "Forbidden" }), _jsx("p", { className: "mt-2 text-sm text-[var(--z-muted)]", children: "You do not have permission to view inventory." })] }));
    }
    const tenantId = (_a = session.tenantId) !== null && _a !== void 0 ? _a : DEFAULT_TENANT_ID;
    try {
        await assertTenantAccess(tenantId);
    }
    catch (_c) {
        return (_jsx("div", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-8 text-center", children: _jsx("div", { className: "text-base font-semibold text-[var(--z-fg)]", children: "Forbidden" }) }));
    }
    const data = await getInventoryDashboard(tenantId);
    await logAudit("inventory.dashboard.view", {
        tenantId,
        profileId: session.userId,
        generatedAt: data.generatedAt,
        source: "page",
    });
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("section", { id: "overview", className: "grid grid-cols-2 gap-3 md:grid-cols-4", children: [_jsx(Kpi, { label: "Total items", value: data.kpis.totalItems, sublabel: `${data.kpis.totalQuantity} units tracked` }), _jsx(Kpi, { label: "In use", value: data.kpis.itemsInUse, sublabel: `${data.kpis.activeCheckouts} active checkouts`, accent: "text-sky-300" }), _jsx(Kpi, { label: "Overdue", value: data.kpis.overdueCheckouts, sublabel: `${data.kpis.itemsMaintenance} in maintenance`, accent: data.kpis.overdueCheckouts > 0 ? "text-rose-300" : undefined }), _jsx(Kpi, { label: "Current value", value: formatCurrency(data.kpis.totalCurrentValue), sublabel: `Depreciated ${formatCurrency(data.kpis.depreciationToDate)}`, accent: "text-[#00ff88]" })] }), _jsxs("section", { id: "items", className: "space-y-2", children: [_jsxs("header", { className: "flex items-center justify-between", children: [_jsx("h2", { className: "text-base font-semibold text-[var(--z-fg)]", children: "Inventory" }), _jsxs("div", { className: "text-xs text-[var(--z-muted)]", children: [data.kpis.maintenanceDue, " maintenance due \u00B7", " ", data.kpis.lowStockItems, " low stock"] })] }), _jsx(InventoryList, { items: data.items })] }), _jsxs("section", { id: "checkouts", className: "space-y-2", children: [_jsx("header", { className: "flex items-center justify-between", children: _jsx("h2", { className: "text-base font-semibold text-[var(--z-fg)]", children: "Overdue checkouts" }) }), _jsx(CheckoutList, { checkouts: data.overdue, maxRows: 20, showItem: true, emptyMessage: "No overdue checkouts." })] }), _jsxs("section", { id: "maintenance", className: "space-y-2", children: [_jsx("header", { className: "flex items-center justify-between", children: _jsx("h2", { className: "text-base font-semibold text-[var(--z-fg)]", children: "Maintenance due" }) }), _jsx(MaintenanceList, { maintenance: data.maintenanceDue, showItem: true, maxRows: 20, emptyMessage: "No scheduled maintenance." })] })] }));
}
