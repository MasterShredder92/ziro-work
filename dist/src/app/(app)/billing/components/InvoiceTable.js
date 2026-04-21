import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from "@/components/ui/utils/cn";
function formatCents(cents) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
    }).format((cents !== null && cents !== void 0 ? cents : 0) / 100);
}
function formatDate(value) {
    if (!value)
        return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime()))
        return "—";
    return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}
function StatusBadge({ row }) {
    var _a;
    const status = ((_a = row.status) !== null && _a !== void 0 ? _a : "unknown").toLowerCase();
    const isOverdue = row.is_overdue;
    const tone = isOverdue
        ? "bg-red-500/15 text-red-300 border-red-500/30"
        : status === "paid"
            ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
            : status === "draft"
                ? "bg-white/5 text-[var(--z-muted)] border-[var(--z-border)]"
                : status === "unpaid" || status === "partially_paid"
                    ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                    : "bg-white/5 text-[var(--z-muted)] border-[var(--z-border)]";
    const label = isOverdue ? `Overdue · ${row.days_overdue}d` : status;
    return (_jsx("span", { className: cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide", tone), children: label }));
}
export function InvoiceTable({ invoices, maxHeight = 520, emptyMessage = "No invoices found.", }) {
    return (_jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] overflow-hidden", children: [_jsx("div", { className: "flex items-center justify-between px-4 py-3 border-b border-[var(--z-border)]", children: _jsxs("div", { children: [_jsx("div", { className: "text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Invoices" }), _jsxs("div", { className: "text-sm font-semibold text-[var(--z-fg)]", children: [invoices.length, " records"] })] }) }), _jsx("div", { className: "grid sticky top-0 z-10 bg-[color-mix(in_oklab,var(--z-surface),white_2%)] border-b border-[var(--z-border)]", style: {
                    gridTemplateColumns: "minmax(140px,1.2fr) minmax(180px,1.6fr) 120px 120px 120px 140px",
                }, children: [
                    "Invoice",
                    "Customer",
                    "Invoiced",
                    "Outstanding",
                    "Due",
                    "Status",
                ].map((label) => (_jsx("div", { className: "px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: label }, label))) }), _jsx("div", { className: "overflow-auto", style: { maxHeight }, children: invoices.length === 0 ? (_jsx("div", { className: "px-4 py-10 text-center text-sm text-[var(--z-muted)]", children: emptyMessage })) : (invoices.map((invoice) => {
                    var _a, _b, _c, _d;
                    return (_jsxs("div", { className: "grid border-b border-[var(--z-border)] last:border-b-0 hover:bg-white/[0.02] transition-colors", style: {
                            gridTemplateColumns: "minmax(140px,1.2fr) minmax(180px,1.6fr) 120px 120px 120px 140px",
                        }, children: [_jsxs("div", { className: "px-4 py-3 text-sm text-[var(--z-fg)] truncate", children: [_jsx("div", { className: "font-medium truncate", children: (_b = (_a = invoice.invoice_number) !== null && _a !== void 0 ? _a : invoice.title) !== null && _b !== void 0 ? _b : invoice.square_invoice_id }), _jsx("div", { className: "text-[11px] text-[var(--z-muted)] truncate", children: formatDate(invoice.invoice_date) })] }), _jsxs("div", { className: "px-4 py-3 text-sm text-[var(--z-fg)] truncate", children: [_jsx("div", { className: "truncate", children: (_c = invoice.customer_name) !== null && _c !== void 0 ? _c : "—" }), _jsx("div", { className: "text-[11px] text-[var(--z-muted)] truncate", children: (_d = invoice.customer_email) !== null && _d !== void 0 ? _d : "" })] }), _jsx("div", { className: "px-4 py-3 text-sm text-[var(--z-fg)] tabular-nums", children: formatCents(invoice.amount_cents) }), _jsx("div", { className: cn("px-4 py-3 text-sm tabular-nums", invoice.outstanding_cents > 0
                                    ? "text-amber-300 font-medium"
                                    : "text-[var(--z-muted)]"), children: formatCents(invoice.outstanding_cents) }), _jsx("div", { className: "px-4 py-3 text-sm text-[var(--z-muted)] tabular-nums", children: formatDate(invoice.due_date) }), _jsx("div", { className: "px-4 py-3 flex items-center", children: _jsx(StatusBadge, { row: invoice }) })] }, invoice.id));
                })) })] }));
}
