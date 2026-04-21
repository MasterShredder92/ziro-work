"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { Card } from "@/components/ui/Card";
import { Section } from "@/components/ui/Section";
import { Table } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/components/ui/utils/cn";
function formatMoney(cents, currency) {
    return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(cents / 100);
}
export function StudentInvoicesCard({ invoices, className }) {
    const columns = [
        { id: "status", header: "Status", width: 120 },
        { id: "amount", header: "Amount", width: 120 },
        { id: "due", header: "Due", width: 140 },
        { id: "desc", header: "Description" },
    ];
    return (_jsx(Card, { variant: "elevated", padding: "lg", radius: "lg", shadow: "sm", className: cn(className), children: _jsx(Section, { title: "Invoices", description: "Ledger activity for this student.", spacing: "tight", children: invoices.length === 0 ? (_jsx("p", { className: "text-sm text-[var(--z-muted)]", children: "No invoices yet." })) : (_jsx(Table, { height: 360, rowHeight: 44, columns: columns, data: invoices, getRowKey: (row) => row.id, renderCell: (row, columnId) => {
                    var _a;
                    if (columnId === "status") {
                        const overdue = row.status === "overdue";
                        return (_jsx(Badge, { variant: overdue ? "danger" : row.status === "paid" ? "success" : "neutral", active: overdue, children: row.status }));
                    }
                    if (columnId === "amount")
                        return formatMoney(row.amount_cents, row.currency);
                    if (columnId === "due")
                        return row.due_at
                            ? new Date(row.due_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                            : "—";
                    if (columnId === "desc")
                        return (_a = row.description) !== null && _a !== void 0 ? _a : "—";
                    return null;
                } })) }) }));
}
