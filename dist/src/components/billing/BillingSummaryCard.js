"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StripePortalButton } from "@/components/billing/StripePortalButton";
import { cn } from "@/components/ui/utils";
function statusVariant(status) {
    if (status === "active")
        return "success";
    if (status === "trialing")
        return "neutral";
    if (status === "past_due")
        return "danger";
    return "neutral";
}
export function BillingSummaryCard({ planName, renewalDate, status, className }) {
    return (_jsx(Card, { variant: "elevated", padding: "lg", radius: "lg", shadow: "sm", className: cn("border-[color-mix(in_oklab,var(--z-accent-color),transparent_78%)] shadow-[0_0_0_1px_color-mix(in_oklab,var(--z-accent-color),transparent_88%),0_0_32px_color-mix(in_oklab,var(--z-accent-color),transparent_92%)]", className), children: _jsxs("div", { className: "flex flex-col gap-[var(--z-space-4)] sm:flex-row sm:items-start sm:justify-between", children: [_jsxs("div", { className: "min-w-0 space-y-[var(--z-space-2)]", children: [_jsx("div", { className: "text-xs font-semibold uppercase tracking-[0.14em] text-[var(--z-muted)]", children: "Current plan" }), _jsx("div", { className: "text-xl font-extrabold tracking-tight text-[var(--z-fg)]", children: planName }), _jsxs("div", { className: "text-sm text-[color-mix(in_oklab,var(--z-fg),transparent_25%)]", children: ["Renews ", _jsx("span", { className: "font-semibold text-[var(--z-accent-color)]", children: renewalDate })] }), _jsx(Badge, { variant: statusVariant(status), active: status === "active" || status === "trialing", children: status.replace("_", " ") })] }), _jsx("div", { className: "flex shrink-0 flex-col gap-[var(--z-space-3)] sm:items-end", children: _jsx(StripePortalButton, { label: "Manage billing" }) })] }) }));
}
