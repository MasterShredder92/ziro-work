"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BUILT_IN_TRIGGERS } from "@/lib/automation/types";
export function TriggerSelector({ value, onChange, disabled }) {
    var _a;
    return (_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-[11px] uppercase tracking-wider font-semibold text-[var(--z-muted)]", children: "Trigger event" }), _jsx("select", { value: (_a = value === null || value === void 0 ? void 0 : value.event) !== null && _a !== void 0 ? _a : "lead.created", disabled: disabled, onChange: (e) => onChange(Object.assign(Object.assign({}, value), { event: e.target.value })), className: "w-full rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-2 text-sm text-[var(--z-fg)] focus:outline-none focus:ring-1 focus:ring-[var(--z-accent)]", children: BUILT_IN_TRIGGERS.map((t) => (_jsx("option", { value: t, children: t }, t))) }), _jsx("div", { className: "text-xs text-[var(--z-muted)]", children: "Fired when this event is dispatched for the tenant." })] }));
}
