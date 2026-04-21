import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth/guards";
import { listInvoices } from "@data/invoices";
import { listFamilies } from "@data/families";
import { formatCents, formatDate, statusTone } from "../../billing/components/format";
export const dynamic = "force-dynamic";
async function resolveSession() {
    try {
        return await requirePermission("billing.read")();
    }
    catch (_a) {
        redirect("/family");
    }
}
export default async function FamilyInvoicesPage() {
    const session = await resolveSession();
    // Families are currently resolved by profile lookup; for the portal we show
    // the tenant's invoices the current user is associated with. Until portal
    // linking is finalized, we scope by tenant (already enforced at @data layer).
    const [invoices, families] = await Promise.all([
        listInvoices(session.tenantId, undefined, { limit: 200 }),
        listFamilies(session.tenantId, undefined, { limit: 200 }),
    ]);
    void families;
    const visible = invoices.filter((inv) => inv.status !== "void");
    return (_jsxs("section", { className: "space-y-4", children: [_jsxs("header", { children: [_jsx("h1", { className: "text-xl font-semibold text-[var(--z-fg)]", children: "Invoices" }), _jsx("p", { className: "text-sm text-[var(--z-muted)]", children: "Recent invoices and balances for your family." })] }), _jsxs("div", { className: "overflow-hidden rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)]", children: [_jsx("div", { className: "grid border-b border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface),white_2%)]", style: {
                            gridTemplateColumns: "minmax(120px,1fr) 120px 120px 120px 120px",
                        }, children: ["Invoice", "Issued", "Due", "Total", "Balance"].map((c) => (_jsx("div", { className: "px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: c }, c))) }), visible.length === 0 ? (_jsx("div", { className: "px-4 py-10 text-center text-sm text-[var(--z-muted)]", children: "No invoices on file." })) : (visible.map((inv) => {
                        var _a;
                        return (_jsxs("div", { className: "grid border-b border-[var(--z-border)] last:border-b-0", style: {
                                gridTemplateColumns: "minmax(120px,1fr) 120px 120px 120px 120px",
                            }, children: [_jsxs("div", { className: "px-4 py-3 text-sm text-[var(--z-fg)]", children: [_jsx("div", { className: "font-medium", children: (_a = inv.number) !== null && _a !== void 0 ? _a : inv.id.slice(0, 8) }), _jsx("div", { className: "text-[11px]", children: _jsx("span", { className: `inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] uppercase ${statusTone(inv.status)}`, children: inv.status }) })] }), _jsx("div", { className: "px-4 py-3 text-sm text-[var(--z-muted)]", children: formatDate(inv.issued_at) }), _jsx("div", { className: "px-4 py-3 text-sm text-[var(--z-muted)]", children: formatDate(inv.due_at) }), _jsx("div", { className: "px-4 py-3 text-sm tabular-nums text-[var(--z-fg)]", children: formatCents(inv.total_cents, inv.currency) }), _jsx("div", { className: "px-4 py-3 text-sm tabular-nums text-amber-300", children: formatCents(inv.balance_cents, inv.currency) })] }, inv.id));
                    }))] })] }));
}
