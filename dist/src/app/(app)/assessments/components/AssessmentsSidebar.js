"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import { useState } from "react";
import clsx from "clsx";
export const ASSESSMENTS_NAV = [
    { id: "overview", label: "Overview", href: "#overview", description: "KPIs & summaries" },
    { id: "assessments", label: "Assessments", href: "#assessments", description: "Quizzes & exams" },
    { id: "questions", label: "Questions", href: "#questions", description: "Bank" },
    { id: "rubrics", label: "Rubrics", href: "#rubrics", description: "Criteria" },
    { id: "attempts", label: "Attempts", href: "#attempts", description: "Student work" },
];
export function AssessmentsSidebar({ tenantLabel }) {
    const [active, setActive] = useState("overview");
    return (_jsxs("aside", { className: "md:sticky md:top-0 md:h-[calc(100vh-52px)] w-full md:w-[240px] shrink-0 border-b md:border-b-0 md:border-r border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface),black_10%)]", children: [_jsxs("div", { className: "px-5 py-4 border-b border-[var(--z-border)]", children: [_jsx("div", { className: "text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Assessments" }), _jsx("div", { className: "mt-1 text-base font-semibold text-[var(--z-fg)] truncate", children: tenantLabel })] }), _jsx("nav", { className: "flex md:block overflow-x-auto md:overflow-visible px-2 py-3 gap-1 md:gap-0 md:space-y-0.5", children: ASSESSMENTS_NAV.map((item) => {
                    const isActive = active === item.id;
                    return (_jsxs(Link, { href: item.href, onClick: () => setActive(item.id), className: clsx("block shrink-0 md:shrink md:w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap md:whitespace-normal", isActive
                            ? "bg-[#00ff88]/10 text-[#00ff88]"
                            : "text-[var(--z-muted)] hover:text-[var(--z-fg)] hover:bg-white/5"), children: [_jsx("div", { children: item.label }), item.description ? (_jsx("div", { className: clsx("hidden md:block text-[11px] mt-0.5", isActive ? "text-[#00ff88]/70" : "text-[var(--z-muted)]"), children: item.description })) : null] }, item.id));
                }) })] }));
}
