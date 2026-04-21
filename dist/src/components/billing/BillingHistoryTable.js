"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import { Table } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/components/ui/utils";
function statusVariant(s) {
    if (s === "paid")
        return "success";
    if (s === "open")
        return "warning";
    if (s === "uncollectible")
        return "danger";
    return "neutral";
}
const columns = [
    { id: "date", header: "Date", width: "1.1fr" },
    { id: "amount", header: "Amount", width: "0.9fr" },
    { id: "status", header: "Status", width: "0.8fr" },
    { id: "download", header: "", width: "120px", align: "right" },
];
export function BillingHistoryTable({ invoices, className }) {
    if (invoices.length === 0) {
        return (_jsxs("div", { className: cn("min-w-0", className), children: [_jsx("div", { className: "mb-[var(--z-space-3)] text-sm font-extrabold text-[var(--z-fg)]", children: "Invoice history" }), _jsx("p", { className: "text-sm text-[var(--z-muted)]", children: "No invoices to display." })] }));
    }
    return (_jsxs("div", { className: cn("min-w-0", className), children: [_jsx("div", { className: "mb-[var(--z-space-3)] text-sm font-extrabold text-[var(--z-fg)]", children: "Invoice history" }), _jsx(Table, { columns: columns, data: invoices, getRowKey: (row) => row.id, rowHeight: 48, height: Math.min(420, 56 + invoices.length * 48), className: "border-[var(--z-border)]", renderCell: (row, columnId) => {
                    if (columnId === "date")
                        return _jsx("span", { className: "text-sm text-[var(--z-fg)]", children: row.date });
                    if (columnId === "amount")
                        return _jsx("span", { className: "font-mono text-sm text-[var(--z-fg)]", children: row.amountLabel });
                    if (columnId === "status")
                        return (_jsx(Badge, { variant: statusVariant(row.status), active: row.status === "open", children: row.status }));
                    if (columnId === "download")
                        return (_jsx(Link, { href: row.downloadHref, className: "text-xs font-semibold text-[var(--z-accent-color)] hover:underline", onClick: (e) => e.preventDefault(), children: "Download (UI)" }));
                    return null;
                } })] }));
}
