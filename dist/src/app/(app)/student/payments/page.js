import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { redirect } from "next/navigation";
import { resolveStudentContext } from "../guard";
import { listPayments } from "@data/payments";
import { listInvoices } from "@data/invoices";
import { formatCents, formatDateTime } from "../../billing/components/format";
export const dynamic = "force-dynamic";
export default async function StudentPaymentsPage() {
    let ctx;
    try {
        ctx = await resolveStudentContext();
    }
    catch (_a) {
        redirect("/student");
    }
    const { tenantId, studentId } = ctx;
    const invoices = await listInvoices(tenantId, { student_id: studentId }, { limit: 500 });
    const invoiceIds = new Set(invoices.map((i) => i.id));
    const invoicesById = new Map(invoices.map((i) => [i.id, i]));
    const allPayments = await listPayments(tenantId, undefined, { limit: 1000 });
    const payments = allPayments
        .filter((p) => (p.invoice_id ? invoiceIds.has(p.invoice_id) : false))
        .sort((a, b) => (a.paid_at > b.paid_at ? -1 : 1));
    return (_jsxs("section", { className: "space-y-4", children: [_jsxs("header", { children: [_jsx("h1", { className: "text-xl font-semibold text-[var(--z-fg)]", children: "Payment history" }), _jsx("p", { className: "text-sm text-[var(--z-muted)]", children: "A read-only record of payments applied to your invoices." })] }), _jsxs("div", { className: "overflow-hidden rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)]", children: [_jsx("div", { className: "grid border-b border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface),white_2%)]", style: {
                            gridTemplateColumns: "160px minmax(160px,1fr) 140px 120px 120px",
                        }, children: ["Received", "Invoice", "Method", "Amount", "Status"].map((c) => (_jsx("div", { className: "px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: c }, c))) }), payments.length === 0 ? (_jsx("div", { className: "px-4 py-10 text-center text-sm text-[var(--z-muted)]", children: "No payments on file." })) : (payments.map((p) => {
                        var _a, _b;
                        const inv = p.invoice_id ? invoicesById.get(p.invoice_id) : null;
                        return (_jsxs("div", { className: "grid border-b border-[var(--z-border)] last:border-b-0", style: {
                                gridTemplateColumns: "160px minmax(160px,1fr) 140px 120px 120px",
                            }, children: [_jsx("div", { className: "px-4 py-3 text-sm text-[var(--z-muted)]", children: formatDateTime(p.paid_at) }), _jsx("div", { className: "px-4 py-3 text-sm text-[var(--z-fg)]", children: inv ? (_a = inv.number) !== null && _a !== void 0 ? _a : inv.id.slice(0, 8) : "—" }), _jsx("div", { className: "px-4 py-3 text-sm text-[var(--z-muted)]", children: (_b = p.method) !== null && _b !== void 0 ? _b : "—" }), _jsx("div", { className: "px-4 py-3 text-sm tabular-nums text-[var(--z-fg)]", children: formatCents(p.amount_cents, p.currency) }), _jsx("div", { className: "px-4 py-3 text-[11px] uppercase tracking-wider text-[var(--z-muted)]", children: p.status })] }, p.id));
                    }))] })] }));
}
