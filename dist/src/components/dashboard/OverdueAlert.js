"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { useInvoices } from "@/hooks/data";
import { DASHBOARD_TENANT_ID } from "./constants";
import { formatUsdFromCents } from "./dashboardFormat";
export function OverdueAlert() {
    const tenantId = DASHBOARD_TENANT_ID;
    const invoiceParams = useMemo(() => ({
        tenantId,
        page: { mode: "offset", page: 1, pageSize: 200 },
    }), [tenantId]);
    const { data: invData } = useInvoices(invoiceParams);
    const { overdueCount, overdueAmount } = useMemo(() => {
        var _a;
        const invoices = (_a = invData === null || invData === void 0 ? void 0 : invData.items) !== null && _a !== void 0 ? _a : [];
        const overdueCount = invoices.filter((i) => i.status === "overdue").length;
        const overdueAmount = invoices
            .filter((i) => i.status === "overdue")
            .reduce((acc, i) => { var _a; return acc + ((_a = i.amount_cents) !== null && _a !== void 0 ? _a : 0); }, 0);
        return { overdueCount, overdueAmount };
    }, [invData]);
    if (overdueCount === 0)
        return null;
    return (_jsxs("div", { className: "flex items-start gap-3 rounded-xl border px-4 py-3", style: {
            borderColor: "rgba(239,68,68,0.4)",
            background: "rgba(239,68,68,0.07)",
        }, children: [_jsx(AlertTriangle, { className: "mt-0.5 h-4 w-4 shrink-0 text-red-400", "aria-hidden": true }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsxs("p", { className: "text-sm font-bold text-red-300", children: [overdueCount, " overdue invoice", overdueCount !== 1 ? "s" : ""] }), _jsxs("p", { className: "mt-0.5 text-xs text-[var(--z-muted)]", children: [formatUsdFromCents(overdueAmount), " outstanding past due date.", " ", _jsx(Link, { href: "/invoices?status=overdue", className: "font-semibold text-red-300 underline underline-offset-2 hover:text-red-200", children: "Review now \u2192" })] })] })] }));
}
