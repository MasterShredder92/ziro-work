"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card } from "@/components/ui/Card";
import { MOCK_USAGE_DEFAULTS, } from "@/lib/billing/mockUsage";
import { cn } from "@/components/ui/utils";
function UsageMeter({ label, value, unit, }) {
    return (_jsx("div", { className: "space-y-[var(--z-space-2)]", children: _jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [_jsx("div", { className: "text-xs font-semibold uppercase tracking-[0.12em] text-[var(--z-muted)]", children: label }), _jsxs("div", { className: "text-xs font-semibold tabular-nums text-[var(--z-fg)]", children: [value, unit ? ` ${unit}` : ""] })] }) }));
}
export function BillingUsageCard({ usage, className }) {
    const snap = usage !== null && usage !== void 0 ? usage : MOCK_USAGE_DEFAULTS;
    return (_jsxs(Card, { variant: "default", padding: "lg", radius: "lg", className: cn("space-y-[var(--z-space-6)]", className), children: [_jsxs("div", { children: [_jsx("div", { className: "text-sm font-extrabold text-[var(--z-fg)]", children: "Workspace usage" }), _jsx("p", { className: "mt-1 text-xs text-[var(--z-muted)]", children: "Live workspace activity overview." })] }), _jsx(UsageMeter, { label: "Active students", value: snap.activeStudents, unit: "" }), _jsx(UsageMeter, { label: "Active teachers", value: snap.activeTeachers, unit: "" }), _jsx(UsageMeter, { label: "Automations", value: snap.automations, unit: "flows" }), _jsx(UsageMeter, { label: "Storage", value: snap.storageMB, unit: "MB" })] }));
}
