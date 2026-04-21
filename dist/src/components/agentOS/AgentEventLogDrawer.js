"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Drawer } from "@/components/ui/Drawer";
import { cn, focusRingClassName } from "@/components/ui/utils";
import { useAgentOS } from "./AgentOSContext";
const EXPERIENCE_PHASES = [
    "GLOBAL-UX-POLISH",
    "PORTAL-UNIFY",
    "SCHED-CONVERGE",
    "AGENT-WIRE",
    "PROD-READY",
];
function relativeTime(at) {
    const delta = Date.now() - at;
    const sec = Math.max(1, Math.floor(delta / 1000));
    if (sec < 60)
        return `${sec}s ago`;
    const min = Math.floor(sec / 60);
    if (min < 60)
        return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 48)
        return `${hr}h ago`;
    const day = Math.floor(hr / 24);
    return `${day}d ago`;
}
export function AgentEventLogDrawer() {
    const { eventLogOpen, closeEventLog, eventLog, clearEventLog } = useAgentOS();
    return (_jsx(Drawer, { open: eventLogOpen, onClose: closeEventLog, title: "AgentOS event log", children: _jsxs("section", { className: "space-y-3", children: [_jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface-2)] p-3", children: [_jsx("div", { className: "mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--z-muted)]", children: "Experience pass" }), _jsx("div", { className: "flex flex-wrap gap-2", children: EXPERIENCE_PHASES.map((phase) => (_jsx("span", { className: "rounded-full border border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-accent),transparent_88%)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--z-fg)]", children: phase }, phase))) })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "text-xs font-semibold uppercase tracking-[0.12em] text-[var(--z-muted)]", children: "Recent activity" }), _jsx("button", { type: "button", onClick: clearEventLog, className: cn("rounded-[var(--z-radius-sm)] border border-[var(--z-border)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--z-muted)] hover:text-[var(--z-fg)]", focusRingClassName()), children: "Clear" })] }), eventLog.length === 0 ? (_jsx("div", { className: "rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] p-4 text-sm text-[var(--z-muted)]", children: "No events yet. Trigger an AgentOS action to populate the log." })) : (_jsx("ul", { className: "space-y-2", children: eventLog.slice(0, 80).map((entry) => {
                        var _a;
                        return (_jsxs("li", { className: cn("rounded-[var(--z-radius-md)] border bg-[var(--z-surface-2)] p-3", entry.level === "error"
                                ? "border-red-500/40"
                                : entry.level === "warning"
                                    ? "border-amber-400/40"
                                    : entry.level === "success"
                                        ? "border-emerald-400/40"
                                        : "border-[var(--z-border)]"), children: [_jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsx("div", { className: "text-sm font-semibold text-[var(--z-fg)]", children: entry.label }), _jsx("span", { className: "text-[10px] uppercase tracking-[0.1em] text-[var(--z-muted)]", children: relativeTime(entry.at) })] }), _jsx("div", { className: "mt-1 text-xs text-[var(--z-muted)]", children: (_a = entry.detail) !== null && _a !== void 0 ? _a : "Action executed" }), _jsxs("div", { className: "mt-1 text-[10px] uppercase tracking-[0.1em] text-[var(--z-muted)]", children: [entry.agentId, " \u00B7 ", entry.actionId] })] }, entry.id));
                    }) }))] }) }));
}
