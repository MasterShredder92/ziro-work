"use client";
import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import Link from "next/link";
import { useState } from "react";
import { formatCents, formatDate, formatDateTime, statusTone } from "./format";
import { PaymentEntryModal } from "./PaymentEntryModal";
export function InvoiceDetail({ invoice, tenantId }) {
    var _a, _b, _c;
    const [openPayment, setOpenPayment] = useState(false);
    async function voidInvoice() {
        var _a;
        if (!confirm("Void this invoice?"))
            return;
        const reason = (_a = prompt("Reason (optional):")) !== null && _a !== void 0 ? _a : undefined;
        await fetch(`/api/billing/invoices/${invoice.id}/void?tenantId=${tenantId}`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ reason }),
        });
        window.location.reload();
    }
    const balance = (_a = invoice.balance_cents) !== null && _a !== void 0 ? _a : 0;
    const timeline = [
        { ts: invoice.created_at, text: "Invoice created" },
        { ts: invoice.issued_at, text: "Issued" },
        { ts: invoice.sent_at, text: "Sent" },
        ...invoice.payments
            .slice()
            .sort((a, b) => (a.paid_at > b.paid_at ? 1 : -1))
            .map((p) => ({
            ts: p.paid_at,
            text: `Payment recorded — ${formatCents(p.amount_cents, invoice.currency)} (${p.method})`,
        })),
        invoice.paid_at ? { ts: invoice.paid_at, text: "Marked paid" } : null,
        invoice.voided_at
            ? { ts: invoice.voided_at, text: `Voided${invoice.void_reason ? ` — ${invoice.void_reason}` : ""}` }
            : null,
    ].filter(Boolean);
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex flex-wrap items-start gap-4", children: [_jsxs("div", { className: "min-w-0 flex-1", children: [_jsxs("div", { className: "text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: ["Invoice ", (_b = invoice.number) !== null && _b !== void 0 ? _b : invoice.id.slice(0, 8)] }), _jsx("h1", { className: "mt-1 text-2xl font-semibold text-[var(--z-fg)]", children: (_c = invoice.description) !== null && _c !== void 0 ? _c : "Invoice" }), _jsxs("div", { className: "mt-1 text-sm text-[var(--z-muted)]", children: ["Due ", formatDate(invoice.due_at), " \u00B7 Issued ", formatDate(invoice.issued_at)] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: `inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase ${statusTone(invoice.status)}`, children: invoice.status }), _jsx("button", { type: "button", onClick: () => setOpenPayment(true), disabled: balance <= 0, className: "inline-flex h-9 items-center rounded-[var(--z-radius-md)] border border-[#00ff88]/40 bg-[#00ff88]/15 px-3 text-sm font-semibold text-[#00ff88] disabled:opacity-40", children: "Record payment" }), _jsx("button", { type: "button", onClick: voidInvoice, disabled: invoice.status === "void", className: "inline-flex h-9 items-center rounded-[var(--z-radius-md)] border border-red-500/40 bg-red-500/10 px-3 text-sm font-semibold text-red-300 disabled:opacity-40", children: "Void" })] })] }), _jsxs("div", { className: "grid gap-4 md:grid-cols-3", children: [_jsx(Kpi, { label: "Total", value: formatCents(invoice.total_cents, invoice.currency) }), _jsx(Kpi, { label: "Paid", value: formatCents(invoice.amount_paid_cents, invoice.currency) }), _jsx(Kpi, { label: "Balance", value: formatCents(balance, invoice.currency), tone: balance > 0 ? "warn" : "ok" })] }), _jsxs("section", { className: "space-y-3", children: [_jsx("h2", { className: "text-lg font-semibold text-[var(--z-fg)]", children: "Line items" }), _jsxs("div", { className: "overflow-hidden rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)]", children: [_jsx("div", { className: "grid border-b border-[var(--z-border)]", style: {
                                    gridTemplateColumns: "minmax(200px,1fr) 80px 120px 120px 80px",
                                }, children: ["Description", "Qty", "Unit", "Amount", "Tax"].map((c) => (_jsx("div", { className: "px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: c }, c))) }), invoice.lineItems.length === 0 ? (_jsx("div", { className: "px-4 py-6 text-center text-sm text-[var(--z-muted)]", children: "No line items." })) : (invoice.lineItems.map((li) => (_jsxs("div", { className: "grid border-b border-[var(--z-border)] last:border-b-0", style: {
                                    gridTemplateColumns: "minmax(200px,1fr) 80px 120px 120px 80px",
                                }, children: [_jsx("div", { className: "px-4 py-3 text-sm text-[var(--z-fg)]", children: li.description }), _jsx("div", { className: "px-4 py-3 text-sm tabular-nums text-[var(--z-muted)]", children: li.quantity }), _jsx("div", { className: "px-4 py-3 text-sm tabular-nums text-[var(--z-muted)]", children: formatCents(li.unit_amount_cents, invoice.currency) }), _jsx("div", { className: "px-4 py-3 text-sm tabular-nums text-[var(--z-fg)]", children: formatCents(li.amount_cents, invoice.currency) }), _jsx("div", { className: "px-4 py-3 text-[11px] text-[var(--z-muted)]", children: li.taxable ? "Taxable" : "—" })] }, li.id))))] })] }), _jsxs("section", { className: "grid gap-4 md:grid-cols-2", children: [_jsx(Panel, { title: "Payments", children: invoice.payments.length === 0 ? (_jsx("div", { className: "text-sm text-[var(--z-muted)]", children: "No payments recorded." })) : (_jsx("ul", { className: "space-y-2 text-sm", children: invoice.payments.map((p) => (_jsxs("li", { className: "flex items-center justify-between rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2", children: [_jsxs("div", { children: [_jsx("div", { className: "font-medium text-[var(--z-fg)]", children: formatCents(p.amount_cents, invoice.currency) }), _jsxs("div", { className: "text-[11px] text-[var(--z-muted)]", children: [p.method, " \u00B7 ", formatDateTime(p.paid_at)] })] }), _jsx("span", { className: "text-[11px] uppercase text-[var(--z-muted)]", children: p.status })] }, p.id))) })) }), _jsx(Panel, { title: "Credits", children: invoice.credits.length === 0 ? (_jsx("div", { className: "text-sm text-[var(--z-muted)]", children: "No credits applied." })) : (_jsx("ul", { className: "space-y-2 text-sm", children: invoice.credits.map((c) => {
                                var _a;
                                return (_jsxs("li", { className: "flex items-center justify-between rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2", children: [_jsxs("div", { children: [_jsxs("div", { className: "font-medium text-[var(--z-fg)]", children: [formatCents(c.applied_cents, invoice.currency), " applied"] }), _jsxs("div", { className: "text-[11px] text-[var(--z-muted)]", children: ["of ", formatCents(c.amount_cents, invoice.currency), " \u2014 ", (_a = c.reason) !== null && _a !== void 0 ? _a : "credit"] })] }), _jsx("span", { className: "text-[11px] uppercase text-[var(--z-muted)]", children: c.status })] }, c.id));
                            }) })) })] }), _jsxs("section", { className: "grid gap-4 md:grid-cols-2", children: [_jsx(Panel, { title: "Timeline", children: _jsx("ol", { className: "space-y-2 text-sm", children: timeline.map((e, i) => (_jsxs("li", { className: "flex items-start gap-2", children: [_jsx("span", { className: "mt-1 inline-block h-2 w-2 rounded-full bg-[#00ff88]" }), _jsxs("div", { children: [_jsx("div", { className: "text-[var(--z-fg)]", children: e.text }), _jsx("div", { className: "text-[11px] text-[var(--z-muted)]", children: formatDateTime(e.ts) })] })] }, i))) }) }), _jsx(Panel, { title: "PDF preview", children: _jsxs("div", { className: "rounded-[var(--z-radius-md)] border border-dashed border-[var(--z-border)] bg-[var(--z-bg)] p-6 text-center text-sm text-[var(--z-muted)]", children: ["PDF generation is queued at issue time. A rendered copy will be attached to invoice emails sent via the Templates OS.", _jsx("div", { className: "mt-3", children: _jsx(Link, { href: `/api/billing/invoices/${invoice.id}?tenantId=${tenantId}`, className: "text-[#00ff88] hover:underline", children: "Download JSON" }) })] }) })] }), openPayment ? (_jsx(PaymentEntryModal, { invoiceId: invoice.id, tenantId: tenantId, maxAmountCents: balance, onClose: () => setOpenPayment(false), onRecorded: () => window.location.reload() })) : null] }));
}
function Kpi({ label, value, tone, }) {
    const toneClass = tone === "warn" ? "text-amber-300" : tone === "ok" ? "text-emerald-300" : "text-[var(--z-fg)]";
    return (_jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4", children: [_jsx("div", { className: "text-[11px] uppercase tracking-wider text-[var(--z-muted)]", children: label }), _jsx("div", { className: `mt-1 text-xl font-semibold tabular-nums ${toneClass}`, children: value })] }));
}
function Panel({ title, children }) {
    return (_jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4", children: [_jsx("div", { className: "mb-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: title }), children] }));
}
