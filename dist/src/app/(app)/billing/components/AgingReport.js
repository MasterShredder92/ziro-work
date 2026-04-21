import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card } from "@/components/ui/Card";
function formatCents(cents) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    }).format((cents !== null && cents !== void 0 ? cents : 0) / 100);
}
export function AgingReport({ buckets }) {
    const totalOutstanding = buckets.reduce((sum, b) => sum + b.outstandingCents, 0);
    return (_jsxs(Card, { variant: "elevated", padding: "md", radius: "lg", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { children: [_jsx("div", { className: "text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Aging report" }), _jsx("div", { className: "text-lg font-semibold text-[var(--z-fg)]", children: "Outstanding by age" })] }), _jsxs("div", { className: "text-sm text-[var(--z-muted)]", children: ["Total ", formatCents(totalOutstanding)] })] }), _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-5 gap-3", children: buckets.map((bucket) => {
                    const share = totalOutstanding > 0
                        ? Math.round((bucket.outstandingCents / totalOutstanding) * 100)
                        : 0;
                    const isOverdue = bucket.id !== "current";
                    const toneText = bucket.id === "90+"
                        ? "text-red-400"
                        : bucket.id === "61-90"
                            ? "text-red-300"
                            : bucket.id === "31-60"
                                ? "text-amber-300"
                                : bucket.id === "0-30"
                                    ? "text-amber-200"
                                    : "text-emerald-300";
                    const barTone = bucket.id === "90+"
                        ? "bg-red-500/70"
                        : bucket.id === "61-90"
                            ? "bg-red-400/70"
                            : bucket.id === "31-60"
                                ? "bg-amber-400/70"
                                : bucket.id === "0-30"
                                    ? "bg-amber-300/70"
                                    : "bg-emerald-400/70";
                    return (_jsxs("div", { className: "rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface),white_1.5%)] p-3", children: [_jsx("div", { className: "text-[11px] uppercase tracking-wider text-[var(--z-muted)]", children: bucket.label }), _jsx("div", { className: `mt-1 text-xl font-semibold tabular-nums ${toneText}`, children: formatCents(bucket.outstandingCents) }), _jsxs("div", { className: "mt-1 text-[11px] text-[var(--z-muted)]", children: [bucket.invoiceCount, " invoice", bucket.invoiceCount === 1 ? "" : "s", isOverdue ? ` · ${share}% of AR` : ""] }), _jsx("div", { className: "mt-2 h-1.5 w-full rounded-full bg-white/[0.04] overflow-hidden", children: _jsx("div", { className: `h-full ${barTone} transition-all`, style: { width: `${Math.min(100, share)}%` } }) })] }, bucket.id));
                }) })] }));
}
