import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
function formatMoney(cents) {
    const n = typeof cents === "number" ? cents / 100 : 0;
    return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}
function formatDate(iso) {
    if (!iso)
        return "—";
    const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
    return d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}
function statusClass(status) {
    const s = (status !== null && status !== void 0 ? status : "").toUpperCase();
    if (s === "PAID")
        return "bg-emerald-500/10 text-emerald-400";
    if (s === "UNPAID" || s === "PARTIALLY_PAID" || s === "SENT")
        return "bg-amber-500/10 text-amber-400";
    if (s === "CANCELED" || s === "CANCELLED")
        return "bg-red-500/10 text-red-400";
    return "bg-white/5 text-[var(--z-muted)]";
}
/** Sticky column header cell — matches CRM portal table pattern */
const PORTAL_TABLE_TH = "sticky top-0 z-20 bg-[var(--z-surface,#0a0a0c)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--z-muted)] shadow-[inset_0_-1px_0_var(--z-border,rgb(28_28_30))]";
export function BillingList({ invoices, summary, title = "Billing", maxRows = 25, }) {
    const rows = invoices.slice(0, maxRows);
    return (_jsxs("section", { className: "flex flex-col gap-3", children: [summary ? (_jsxs("div", { className: "grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 lg:grid-cols-4", children: [_jsx(StatCard, { label: "Balance", value: formatMoney(summary.balanceCents), tone: "amber" }), _jsx(StatCard, { label: "Paid", value: formatMoney(summary.totalPaidCents), tone: "emerald" }), _jsx(StatCard, { label: "Billed", value: formatMoney(summary.totalBilledCents) }), _jsx(StatCard, { label: "Overdue", value: `${summary.overdueCount}`, suffix: summary.overdueAmountCents > 0
                            ? formatMoney(summary.overdueAmountCents)
                            : undefined, tone: summary.overdueCount > 0 ? "red" : undefined })] })) : null, _jsxs("div", { className: "overflow-hidden rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)]", children: [_jsxs("header", { className: "flex items-center justify-between border-b border-[var(--z-border)] px-4 py-3", children: [_jsx("h2", { className: "text-sm font-semibold text-[var(--z-fg)]", children: title }), _jsxs("span", { className: "text-xs text-[var(--z-muted)]", children: [invoices.length, " ", invoices.length === 1 ? "invoice" : "invoices"] })] }), rows.length === 0 ? (_jsx("div", { className: "px-4 py-8 text-center text-sm text-[var(--z-muted)]", children: "No invoices on file." })) : (_jsx("div", { className: "isolate max-h-[min(70vh,720px)] overflow-auto overscroll-contain", children: _jsxs("table", { className: "w-full min-w-[640px] text-left text-sm", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { className: `${PORTAL_TABLE_TH} text-left`, children: "Invoice" }), _jsx("th", { className: `${PORTAL_TABLE_TH} text-left`, children: "Date" }), _jsx("th", { className: `${PORTAL_TABLE_TH} text-left`, children: "Due" }), _jsx("th", { className: `${PORTAL_TABLE_TH} text-right`, children: "Amount" }), _jsx("th", { className: `${PORTAL_TABLE_TH} text-right`, children: "Balance" }), _jsx("th", { className: `${PORTAL_TABLE_TH} text-left`, children: "Status" })] }) }), _jsx("tbody", { className: "divide-y divide-[var(--z-border)]", children: rows.map((inv) => {
                                        var _a, _b, _c;
                                        return (_jsxs("tr", { children: [_jsxs("td", { className: "px-4 py-2 text-[var(--z-fg)]", children: [_jsx("div", { className: "font-medium", children: (_b = (_a = inv.invoice_number) !== null && _a !== void 0 ? _a : inv.title) !== null && _b !== void 0 ? _b : inv.id.slice(0, 8) }), inv.title && inv.invoice_number ? (_jsx("div", { className: "text-xs text-[var(--z-muted)]", children: inv.title })) : null] }), _jsx("td", { className: "px-4 py-2 text-[var(--z-muted)]", children: formatDate(inv.invoice_date) }), _jsx("td", { className: "px-4 py-2 text-[var(--z-muted)]", children: formatDate(inv.due_date) }), _jsx("td", { className: "px-4 py-2 text-right text-[var(--z-fg)]", children: formatMoney(inv.amount_cents) }), _jsx("td", { className: "px-4 py-2 text-right text-[var(--z-fg)]", children: formatMoney(inv.balance_cents) }), _jsx("td", { className: "px-4 py-2", children: _jsx("span", { className: `rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide ${statusClass(inv.status)}`, children: (_c = inv.status) !== null && _c !== void 0 ? _c : "—" }) })] }, inv.id));
                                    }) })] }) }))] })] }));
}
function StatCard({ label, value, suffix, tone, }) {
    const toneClass = tone === "amber"
        ? "text-amber-400"
        : tone === "emerald"
            ? "text-emerald-400"
            : tone === "red"
                ? "text-red-400"
                : "text-[var(--z-fg)]";
    return (_jsxs("div", { className: "rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-4", children: [_jsx("div", { className: "text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: label }), _jsxs("div", { className: "mt-1 flex items-baseline gap-1.5", children: [_jsx("span", { className: `text-lg font-semibold ${toneClass}`, children: value }), suffix ? (_jsx("span", { className: "text-xs text-[var(--z-muted)]", children: suffix })) : null] })] }));
}
