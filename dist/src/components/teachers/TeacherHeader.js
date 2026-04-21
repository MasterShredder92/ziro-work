"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
function formatUsd(n) {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}
export function TeacherHeader({ teacher, capacity, payrollImpact, className }) {
    return (_jsx(PageHeader, { className: className, title: teacher.name, subtitle: _jsxs("span", { className: "flex flex-wrap items-center gap-[var(--z-space-2)]", children: [_jsx(Badge, { variant: "neutral", children: teacher.status }), _jsxs(Badge, { variant: "success", active: true, children: ["Capacity ", capacity, " seats"] }), _jsxs(Badge, { variant: "warning", children: ["Payroll est. ", formatUsd(payrollImpact)] })] }) }));
}
