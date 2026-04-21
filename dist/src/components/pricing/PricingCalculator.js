"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/components/ui/utils";
function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
}
function estimateMonthly(students, teachers) {
    const s = clamp(students, 0, 500);
    const t = clamp(teachers, 0, 80);
    const launch = 49 + s * 0.45 + t * 5.5;
    const scale = 129 + s * 0.22 + t * 4.25;
    const command = 399 + s * 0.08 + t * 3;
    return { launch, scale, command };
}
function recommendedPlan(students, teachers) {
    if (students <= 48 && teachers <= 6)
        return "Launch";
    if (students <= 220 && teachers <= 22)
        return "Scale";
    return "Command";
}
function formatUsd(n) {
    return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    }).format(Math.round(n));
}
export function PricingCalculator() {
    const [students, setStudents] = React.useState(48);
    const [teachers, setTeachers] = React.useState(5);
    const { launch, scale, command } = estimateMonthly(students, teachers);
    const rec = recommendedPlan(students, teachers);
    return (_jsx(Card, { variant: "elevated", padding: "lg", radius: "lg", className: "border-[color-mix(in_oklab,var(--z-accent),transparent_65%)]", children: _jsxs("div", { className: "flex flex-col gap-[var(--z-space-6)] lg:flex-row lg:items-start lg:justify-between", children: [_jsxs("div", { className: "min-w-0 flex-1 space-y-[var(--z-space-5)]", children: [_jsxs("div", { children: [_jsx("label", { className: "text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--z-muted)]", children: "Students" }), _jsxs("div", { className: "mt-2 flex items-center gap-4", children: [_jsx("input", { type: "range", min: 0, max: 300, value: students, onChange: (e) => setStudents(Number(e.target.value)), className: "h-2 w-full max-w-md cursor-pointer accent-[var(--z-accent)]" }), _jsx("span", { className: "w-10 text-right text-sm font-extrabold text-[var(--z-accent)]", children: students })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--z-muted)]", children: "Teachers" }), _jsxs("div", { className: "mt-2 flex items-center gap-4", children: [_jsx("input", { type: "range", min: 0, max: 40, value: teachers, onChange: (e) => setTeachers(Number(e.target.value)), className: "h-2 w-full max-w-md cursor-pointer accent-[var(--z-accent)]" }), _jsx("span", { className: "w-10 text-right text-sm font-extrabold text-[var(--z-accent)]", children: teachers })] })] })] }), _jsxs("div", { className: "w-full shrink-0 space-y-3 rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface-2)] p-[var(--z-space-4)] lg:w-72", children: [_jsx("div", { className: "text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--z-muted)]", children: "Estimated monthly" }), _jsxs("div", { className: "space-y-2 text-sm", children: [_jsx(PlanRow, { label: "Launch", value: launch, active: rec === "Launch" }), _jsx(PlanRow, { label: "Scale", value: scale, active: rec === "Scale" }), _jsx(PlanRow, { label: "Command", value: command, active: rec === "Command" })] }), _jsxs("div", { className: "flex items-center gap-2 pt-1", children: [_jsx("span", { className: "text-xs text-[var(--z-muted)]", children: "Recommended" }), _jsx(Badge, { variant: "success", active: true, className: "text-[10px]", children: rec })] }), _jsx("p", { className: "text-[11px] leading-relaxed text-[var(--z-muted)]", children: "Illustrative estimator \u2014 final billing depends on modules, locations, and contract terms." })] })] }) }));
}
function PlanRow({ label, value, active, }) {
    return (_jsxs("div", { className: cn("flex items-center justify-between rounded-[var(--z-radius-sm)] px-2 py-1.5", active && "bg-[color-mix(in_oklab,var(--z-accent),transparent_90%)] ring-1 ring-[color-mix(in_oklab,var(--z-accent),transparent_55%)]"), children: [_jsx("span", { className: cn("font-semibold", active ? "text-black" : "text-[var(--z-fg)]"), children: label }), _jsx("span", { className: cn("font-extrabold", active ? "text-black" : "text-[var(--z-muted)]"), children: formatUsd(value) })] }));
}
