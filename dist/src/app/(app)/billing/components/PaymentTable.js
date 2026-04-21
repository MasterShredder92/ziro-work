import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
export function PaymentTable({ payments, maxHeight = 420, emptyMessage = "No payments recorded.", }) {
    return (_jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] overflow-hidden", children: [_jsx("div", { className: "flex items-center justify-between px-4 py-3 border-b border-[var(--z-border)]", children: _jsxs("div", { children: [_jsx("div", { className: "text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Payments" }), _jsxs("div", { className: "text-sm font-semibold text-[var(--z-fg)]", children: [payments.length, " records"] })] }) }), _jsx("div", { className: "grid sticky top-0 z-10 bg-[color-mix(in_oklab,var(--z-surface),white_2%)] border-b border-[var(--z-border)]", style: {
                    gridTemplateColumns: "120px minmax(140px,1.4fr) 140px 120px 120px",
                }, children: ["Date", "Payment", "Tender", "Gross", "Net"].map((label) => (_jsx("div", { className: "px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: label }, label))) }), _jsx("div", { className: "overflow-auto", style: { maxHeight }, children: payments.length === 0 ? (_jsx("div", { className: "px-4 py-10 text-center text-sm text-[var(--z-muted)]", children: emptyMessage })) : (payments.map((payment) => {
                    var _a, _b;
                    return (_jsxs("div", { className: "grid border-b border-[var(--z-border)] last:border-b-0 hover:bg-white/[0.02] transition-colors", style: {
                            gridTemplateColumns: "120px minmax(140px,1.4fr) 140px 120px 120px",
                        }, children: [_jsx("div", { className: "px-4 py-3 text-sm text-[var(--z-muted)] tabular-nums", children: formatDate(payment.reporting_date) }), _jsxs("div", { className: "px-4 py-3 text-sm text-[var(--z-fg)] truncate", children: [_jsx("div", { className: "font-medium truncate", children: payment.square_payment_id }), _jsx("div", { className: "text-[11px] text-[var(--z-muted)] truncate", children: (_a = payment.status) !== null && _a !== void 0 ? _a : "—" })] }), _jsx("div", { className: "px-4 py-3 text-sm text-[var(--z-muted)] truncate", children: (_b = payment.tender_bucket) !== null && _b !== void 0 ? _b : "—" }), _jsx("div", { className: "px-4 py-3 text-sm text-[var(--z-fg)] tabular-nums", children: formatCents(payment.total_money_cents) }), _jsx("div", { className: "px-4 py-3 text-sm text-emerald-300 tabular-nums font-medium", children: formatCents(payment.net_cents) })] }, payment.id));
                })) })] }));
}
