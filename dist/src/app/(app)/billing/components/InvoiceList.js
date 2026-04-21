"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import { useMemo, useState } from "react";
import { formatCents, formatDate, statusTone } from "./format";
const STATUS_OPTIONS = [
    { id: "", label: "All" },
    { id: "draft", label: "Draft" },
    { id: "open", label: "Open" },
    { id: "sent", label: "Sent" },
    { id: "partial", label: "Partial" },
    { id: "paid", label: "Paid" },
    { id: "overdue", label: "Overdue" },
    { id: "void", label: "Void" },
];
export function InvoiceList({ invoices, tenantId }) {
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [selected, setSelected] = useState({});
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return invoices.filter((inv) => {
            var _a, _b;
            if (statusFilter && inv.status !== statusFilter)
                return false;
            if (!q)
                return true;
            const hay = `${(_a = inv.number) !== null && _a !== void 0 ? _a : ""} ${(_b = inv.description) !== null && _b !== void 0 ? _b : ""}`.toLowerCase();
            return hay.includes(q);
        });
    }, [invoices, query, statusFilter]);
    const selectedIds = Object.keys(selected).filter((id) => selected[id]);
    const anySelected = selectedIds.length > 0;
    async function bulkVoid() {
        for (const id of selectedIds) {
            await fetch(`/api/billing/invoices/${id}/void?tenantId=${tenantId}`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ reason: "Bulk void" }),
            });
        }
        window.location.reload();
    }
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [_jsx("input", { type: "search", placeholder: "Search by number or description", value: query, onChange: (e) => setQuery(e.target.value), className: "h-9 min-w-[220px] flex-1 rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-3 text-sm text-[var(--z-fg)]" }), _jsx("select", { value: statusFilter, onChange: (e) => setStatusFilter(e.target.value), className: "h-9 rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-3 text-sm text-[var(--z-fg)]", children: STATUS_OPTIONS.map((o) => (_jsx("option", { value: o.id, children: o.label }, o.id))) }), _jsx(Link, { href: `/billing/invoices/new?tenantId=${tenantId}`, className: "ml-auto inline-flex h-9 items-center rounded-[var(--z-radius-md)] border border-[#00ff88]/40 bg-[#00ff88]/10 px-3 text-sm font-semibold text-[#00ff88]", children: "+ New invoice" }), _jsxs("button", { type: "button", onClick: bulkVoid, disabled: !anySelected, className: "inline-flex h-9 items-center rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-3 text-sm text-[var(--z-fg)] disabled:opacity-40", children: ["Void selected (", selectedIds.length, ")"] })] }), _jsxs("div", { className: "overflow-hidden rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)]", children: [_jsxs("div", { className: "grid border-b border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface),white_2%)]", style: {
                            gridTemplateColumns: "40px minmax(120px,1fr) minmax(180px,1.6fr) 120px 120px 120px 120px",
                        }, children: [_jsx("div", { className: "px-4 py-2.5" }), ["Number", "Description", "Total", "Paid", "Balance", "Status"].map((c) => (_jsx("div", { className: "px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: c }, c)))] }), filtered.length === 0 ? (_jsx("div", { className: "px-4 py-10 text-center text-sm text-[var(--z-muted)]", children: "No invoices match your filters." })) : (filtered.map((inv) => {
                        var _a, _b;
                        return (_jsxs("div", { className: "grid border-b border-[var(--z-border)] last:border-b-0 hover:bg-white/[0.02]", style: {
                                gridTemplateColumns: "40px minmax(120px,1fr) minmax(180px,1.6fr) 120px 120px 120px 120px",
                            }, children: [_jsx("div", { className: "flex items-center justify-center px-4 py-3", children: _jsx("input", { type: "checkbox", checked: Boolean(selected[inv.id]), onChange: (e) => setSelected((prev) => (Object.assign(Object.assign({}, prev), { [inv.id]: e.target.checked }))) }) }), _jsxs("div", { className: "px-4 py-3 text-sm text-[var(--z-fg)]", children: [_jsx(Link, { href: `/billing/invoices/${inv.id}?tenantId=${tenantId}`, className: "font-medium hover:underline", children: (_a = inv.number) !== null && _a !== void 0 ? _a : inv.id.slice(0, 8) }), _jsxs("div", { className: "text-[11px] text-[var(--z-muted)]", children: ["Due ", formatDate(inv.due_at)] })] }), _jsx("div", { className: "px-4 py-3 text-sm text-[var(--z-fg)] truncate", children: (_b = inv.description) !== null && _b !== void 0 ? _b : "—" }), _jsx("div", { className: "px-4 py-3 text-sm tabular-nums text-[var(--z-fg)]", children: formatCents(inv.total_cents, inv.currency) }), _jsx("div", { className: "px-4 py-3 text-sm tabular-nums text-[var(--z-muted)]", children: formatCents(inv.amount_paid_cents, inv.currency) }), _jsx("div", { className: "px-4 py-3 text-sm tabular-nums text-amber-300", children: formatCents(inv.balance_cents, inv.currency) }), _jsx("div", { className: "px-4 py-3", children: _jsx("span", { className: `inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase ${statusTone(inv.status)}`, children: inv.status }) })] }, inv.id));
                    }))] })] }));
}
