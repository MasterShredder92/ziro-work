"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import Link from "next/link";
import { Table } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
function makeRows(count) {
    return Array.from({ length: count }).map((_, i) => ({
        id: `row-${i + 1}`,
        name: `Account ${String(i + 1).padStart(3, "0")}`,
        status: i % 9 === 0 ? "At Risk" : i % 4 === 0 ? "New" : "Active",
        mrr: 250 + (i % 37) * 25,
    }));
}
export default function SandboxTablePage() {
    const data = React.useMemo(() => makeRows(2000), []);
    const columns = React.useMemo(() => [
        { id: "name", header: "Name", width: "1fr" },
        { id: "status", header: "Status", width: 160 },
        { id: "mrr", header: "MRR", width: 120, align: "right" },
        { id: "action", header: "", width: 120, align: "right" },
    ], []);
    return (_jsxs("div", { className: "space-y-[var(--z-space-6)]", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-xl font-extrabold", children: "Table" }), _jsx(Link, { className: "text-xs text-[var(--z-muted)] hover:text-[var(--z-fg)]", href: "/sandbox", children: "Back" })] }), _jsx("div", { className: "text-sm text-[var(--z-muted)]", children: "Virtualized (windowed) rendering + sticky header. Try scrolling fast." }), _jsx(Table, { columns: columns, data: data, height: 560, getRowKey: (r) => r.id, renderCell: (row, col) => {
                    if (col === "name")
                        return row.name;
                    if (col === "mrr")
                        return `$${row.mrr.toLocaleString()}`;
                    if (col === "status") {
                        const variant = row.status === "Active"
                            ? "success"
                            : row.status === "At Risk"
                                ? "danger"
                                : "warning";
                        return (_jsx(Badge, { variant: variant, active: row.status === "Active", children: row.status }));
                    }
                    if (col === "action")
                        return _jsx(Button, { size: "sm", variant: "ghost", children: "Open" });
                    return null;
                } })] }));
}
