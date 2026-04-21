"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { TRIGGER_CATALOG } from "@/lib/automation/workflows/types";
export function TriggerEditor({ open, trigger, onClose, onSave }) {
    var _a;
    if (!open)
        return null;
    const triggerEntry = (_a = TRIGGER_CATALOG.find((t) => t.type === trigger.type)) !== null && _a !== void 0 ? _a : null;
    return (_jsxs("div", { className: "fixed inset-0 z-[70] flex", role: "presentation", children: [_jsx("button", { type: "button", className: "flex-1 bg-black/45", "aria-label": "Close trigger editor", onClick: onClose }), _jsx("aside", { className: "h-full w-full max-w-full animate-[slideInRight_180ms_ease-out] border-l border-[var(--z-border)] bg-[var(--z-surface)] shadow-2xl md:w-96", children: _jsxs("div", { className: "flex h-full flex-col", children: [_jsxs("div", { className: "flex items-center justify-between border-b border-[var(--z-border)] px-4 py-3", children: [_jsx("div", { className: "text-sm font-semibold text-[var(--z-fg)]", children: "Trigger editor" }), _jsx("button", { type: "button", onClick: onClose, className: "rounded border border-[var(--z-border)] px-2 py-1 text-xs text-[var(--z-muted)] hover:bg-white/[0.05]", children: "Close" })] }), _jsxs("div", { className: "min-h-0 flex-1 space-y-3 overflow-y-auto p-4", children: [_jsxs("label", { className: "block text-xs text-[var(--z-muted)]", children: ["Trigger type", _jsx("select", { value: trigger.type, onChange: (e) => onSave(Object.assign(Object.assign({}, trigger), { type: e.target.value, config: {} })), className: "mt-1 w-full rounded border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-sm text-[var(--z-fg)]", children: TRIGGER_CATALOG.map((item) => (_jsx("option", { value: item.type, children: item.label }, item.type))) })] }), (triggerEntry === null || triggerEntry === void 0 ? void 0 : triggerEntry.description) ? (_jsx("p", { className: "text-xs text-[var(--z-muted)]", children: triggerEntry.description })) : null, (triggerEntry === null || triggerEntry === void 0 ? void 0 : triggerEntry.configSchema)
                                    ? Object.entries(triggerEntry.configSchema).map(([k, v]) => {
                                        var _a, _b;
                                        return (_jsxs("label", { className: "block text-xs text-[var(--z-muted)]", children: [v.label, v.required ? " *" : "", _jsx("input", { type: v.type === "number" ? "number" : "text", value: String((_b = (_a = trigger.config) === null || _a === void 0 ? void 0 : _a[k]) !== null && _b !== void 0 ? _b : ""), onChange: (e) => {
                                                        var _a;
                                                        return onSave(Object.assign(Object.assign({}, trigger), { config: Object.assign(Object.assign({}, ((_a = trigger.config) !== null && _a !== void 0 ? _a : {})), { [k]: e.target.value }) }));
                                                    }, className: "mt-1 w-full rounded border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-sm text-[var(--z-fg)]" })] }, k));
                                    })
                                    : null] })] }) })] }));
}
