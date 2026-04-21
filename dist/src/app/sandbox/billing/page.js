"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { BillingSummaryCard } from "@/components/billing/BillingSummaryCard";
import { BillingUsageCard } from "@/components/billing/BillingUsageCard";
import { PlanSelector } from "@/components/billing/PlanSelector";
import { MOCK_USAGE_DEFAULTS } from "@/lib/billing/mockUsage";
const DEMO_PLANS = [
    { id: "a", name: "Sandbox A", price: "$0", features: ["Demo row", "Neon hover"] },
    { id: "b", name: "Sandbox B", price: "$12", features: ["Meter preview", "Charcoal shell"], highlighted: true },
];
export default function SandboxBillingPage() {
    const [plan, setPlan] = React.useState("b");
    return (_jsx("div", { className: "min-h-full bg-[var(--z-bg)] p-[var(--z-space-8)] text-[var(--z-fg)]", children: _jsxs("div", { className: "mx-auto max-w-5xl space-y-[var(--z-space-10)]", children: [_jsxs("header", { children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.2em] text-[var(--z-muted)]", children: "Sandbox" }), _jsx("h1", { className: "mt-2 text-2xl font-semibold tracking-tight", children: "Billing UI" })] }), _jsxs("section", { className: "space-y-[var(--z-space-3)]", children: [_jsx("h2", { className: "text-sm font-extrabold uppercase tracking-[0.14em] text-[var(--z-muted)]", children: "Summary" }), _jsx(BillingSummaryCard, { planName: "Sandbox", renewalDate: "\u2014", status: "trialing" })] }), _jsxs("section", { className: "space-y-[var(--z-space-3)]", children: [_jsx("h2", { className: "text-sm font-extrabold uppercase tracking-[0.14em] text-[var(--z-muted)]", children: "Plan selector" }), _jsx(PlanSelector, { plans: DEMO_PLANS, selectedPlanId: plan, onSelect: setPlan })] }), _jsxs("section", { className: "space-y-[var(--z-space-3)]", children: [_jsx("h2", { className: "text-sm font-extrabold uppercase tracking-[0.14em] text-[var(--z-muted)]", children: "Usage meters" }), _jsx(BillingUsageCard, { usage: Object.assign(Object.assign({}, MOCK_USAGE_DEFAULTS), { activeStudents: 72, storageMB: 9200 }) })] })] }) }));
}
