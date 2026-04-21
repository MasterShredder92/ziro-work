"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { StageSurfaceClient } from "./[stage]/_client";
import { AgentPageBar } from "@/components/agentOS/AgentPageBar";
// ─── Stage definitions ────────────────────────────────────────────────────────
const STAGES = [
    { id: "intake", label: "Inquiries", short: "Inquiries" },
    { id: "lead-work", label: "Follow-up", short: "Follow-up" },
    { id: "scheduling", label: "Scheduling", short: "Scheduling" },
    { id: "enrollment", label: "Enrollment", short: "Enrollment" },
    { id: "service-delivery", label: "Ongoing Lessons", short: "Lessons" },
    { id: "relationship", label: "Client Care", short: "Care" },
    { id: "retention", label: "Retention", short: "Retention" },
    { id: "win-back", label: "Win Back", short: "Win Back" },
];
// Arrow connector between tabs (desktop only)
function Arrow() {
    return (_jsx("svg", { viewBox: "0 0 16 16", fill: "none", className: "h-3 w-3 shrink-0 text-[#303035]", "aria-hidden": true, children: _jsx("path", { d: "M4 8h8M9 5l3 3-3 3", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }) }));
}
export function LifecycleTabsClient({ tenantId, locationId, initialTab }) {
    var _a;
    const router = useRouter();
    const searchParams = useSearchParams();
    // Derive active tab from URL or prop
    const activeTab = (searchParams.get("tab") || initialTab);
    const activeIndex = STAGES.findIndex((s) => s.id === activeTab);
    const safeActiveTab = activeIndex >= 0 ? activeTab : "intake";
    const activeStage = (_a = STAGES.find((s) => s.id === safeActiveTab)) !== null && _a !== void 0 ? _a : STAGES[0];
    function setTab(id) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("tab", id);
        router.push(`/lifecycle?${params.toString()}`, { scroll: false });
    }
    return (_jsxs("div", { className: "flex flex-col h-full min-h-0", children: [_jsxs("div", { className: "shrink-0 px-6 pt-6 pb-0 space-y-4", children: [_jsxs("div", { children: [_jsx("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: "Customer Lifecycle" }), _jsx("h1", { className: "text-xl font-semibold text-[var(--z-fg)]", children: "Student Journey" }), _jsx("p", { className: "text-xs text-[var(--z-muted)] mt-0.5", children: "Track every student from first inquiry to long-term retention." })] }), _jsx(AgentPageBar, { agentId: "star", chatPlaceholder: "Ask STAR about this stage\u2026", pageContext: { page: "lifecycle", stage: safeActiveTab } }), _jsxs("div", { className: "sm:hidden", children: [_jsx("label", { className: "sr-only", htmlFor: "stage-select", children: "Select stage" }), _jsxs("div", { className: "relative", children: [_jsx("select", { id: "stage-select", value: safeActiveTab, onChange: (e) => setTab(e.target.value), className: "w-full appearance-none rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] px-4 py-2.5 pr-10 text-sm font-semibold text-[var(--z-fg)] focus:outline-none focus:ring-2 focus:ring-[#00ff88]/40", style: { borderColor: "#00ff88", color: "#00ff88" }, children: STAGES.map((stage, i) => (_jsxs("option", { value: stage.id, style: { color: "#f0f0f0", background: "#0a0a0c" }, children: [i + 1, ". ", stage.label] }, stage.id))) }), _jsx("div", { className: "pointer-events-none absolute inset-y-0 right-3 flex items-center", children: _jsx("svg", { className: "h-4 w-4 text-[#00ff88]", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 9l-7 7-7-7" }) }) })] })] }), _jsx("div", { className: "hidden sm:block overflow-x-auto pb-0", children: _jsx("div", { className: "flex items-center gap-1 min-w-max", children: STAGES.map((stage, i) => {
                                const isActive = stage.id === safeActiveTab;
                                const isPast = STAGES.findIndex((s) => s.id === safeActiveTab) > i;
                                return (_jsxs(React.Fragment, { children: [_jsxs("button", { type: "button", onClick: () => setTab(stage.id), className: [
                                                "relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all whitespace-nowrap",
                                                isActive
                                                    ? "bg-[#00ff88]/15 text-[#00ff88] border border-[#00ff88]/30"
                                                    : isPast
                                                        ? "text-[#505055] hover:text-[#909098] hover:bg-white/5 border border-transparent"
                                                        : "text-[#303035] hover:text-[#505055] hover:bg-white/3 border border-transparent",
                                            ].join(" "), children: [_jsx("span", { className: [
                                                        "flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold shrink-0",
                                                        isActive
                                                            ? "bg-[#00ff88]/30 text-[#00ff88]"
                                                            : isPast
                                                                ? "bg-[#303035] text-[#505055]"
                                                                : "bg-[#1c1c1e] text-[#303035]",
                                                    ].join(" "), children: i + 1 }), _jsx("span", { children: stage.label })] }), i < STAGES.length - 1 && _jsx(Arrow, {})] }, stage.id));
                            }) }) }), _jsx("div", { className: "border-b border-[var(--z-border)]" })] }), _jsx("div", { className: "flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-[var(--z-space-6)]", children: _jsx(StageSurfaceClient, { stageId: safeActiveTab, tenantId: tenantId, locationId: locationId }, safeActiveTab) })] }));
}
