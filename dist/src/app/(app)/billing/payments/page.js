import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth/guards";
import { listPayments } from "@/lib/billing/paymentQueries";
import { formatCents, formatDateTime } from "../components/format";
export const dynamic = "force-dynamic";
async function resolveSession() {
    try {
        return await requirePermission("billing.read")();
    }
    catch (_a) {
        redirect("/dashboard");
    }
}
export default async function BillingPaymentsPage() {
    const session = await resolveSession();
    const payments = await listPayments(session.tenantId, undefined, { limit: 500 });
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("header", { children: [_jsx("h1", { className: "text-2xl font-semibold text-[var(--z-fg)]", children: "Payments" }), _jsx("p", { className: "text-sm text-[var(--z-muted)]", children: "Ledger of incoming revenue, refunds, and credits." })] }), _jsxs("div", { className: "overflow-hidden rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)]", children: [_jsx("div", { className: "grid border-b border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface),white_2%)]", style: {
                            gridTemplateColumns: "minmax(160px,1fr) 140px 120px 140px 140px 120px",
                        }, children: ["Paid at", "Method", "Amount", "Refunded", "Invoice", "Status"].map((c) => (_jsx("div", { className: "px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: c }, c))) }), payments.length === 0 ? (_jsx("div", { className: "px-4 py-10 text-center text-sm text-[var(--z-muted)]", children: "No payments recorded." })) : (payments.map((p) => (_jsxs("div", { className: "grid border-b border-[var(--z-border)] last:border-b-0 hover:bg-white/[0.02]", style: {
                            gridTemplateColumns: "minmax(160px,1fr) 140px 120px 140px 140px 120px",
                        }, children: [_jsx("div", { className: "px-4 py-3 text-sm text-[var(--z-fg)]", children: formatDateTime(p.paid_at) }), _jsx("div", { className: "px-4 py-3 text-sm text-[var(--z-muted)]", children: p.method }), _jsx("div", { className: "px-4 py-3 text-sm tabular-nums text-[var(--z-fg)]", children: formatCents(p.amount_cents, p.currency) }), _jsx("div", { className: "px-4 py-3 text-sm tabular-nums text-[var(--z-muted)]", children: formatCents(p.refunded_cents, p.currency) }), _jsx("div", { className: "px-4 py-3 text-[11px] text-[var(--z-muted)]", children: p.invoice_id ? p.invoice_id.slice(0, 8) : "—" }), _jsx("div", { className: "px-4 py-3 text-sm uppercase text-[var(--z-fg)]", children: p.status })] }, p.id))))] })] }));
}
