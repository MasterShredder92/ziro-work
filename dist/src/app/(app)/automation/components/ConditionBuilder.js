"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const OPS = [
    "eq",
    "neq",
    "gt",
    "gte",
    "lt",
    "lte",
    "in",
    "nin",
    "exists",
    "not_exists",
    "contains",
];
export function ConditionBuilder({ conditions, onChange, disabled, }) {
    const update = (index, patch) => {
        const next = conditions.slice();
        next[index] = Object.assign(Object.assign({}, next[index]), patch);
        onChange(next);
    };
    const remove = (index) => {
        onChange(conditions.filter((_, i) => i !== index));
    };
    const add = () => {
        onChange([
            ...conditions,
            { path: "payload.", op: "eq", value: "" },
        ]);
    };
    return (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("label", { className: "text-[11px] uppercase tracking-wider font-semibold text-[var(--z-muted)]", children: "Conditions (all must match)" }), _jsx("button", { type: "button", disabled: disabled, onClick: add, className: "text-xs font-semibold text-[var(--z-accent)] hover:underline disabled:opacity-50", children: "+ Add condition" })] }), conditions.length === 0 ? (_jsx("div", { className: "text-xs text-[var(--z-muted)] italic", children: "No conditions \u2014 the rule fires whenever the trigger matches." })) : (_jsx("div", { className: "space-y-2", children: conditions.map((c, i) => {
                    var _a;
                    return (_jsxs("div", { className: "flex flex-wrap items-center gap-2 rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface-2)] p-2", children: [_jsx("input", { type: "text", value: c.path, disabled: disabled, placeholder: "payload.field", onChange: (e) => update(i, { path: e.target.value }), className: "flex-1 min-w-[160px] rounded border border-[var(--z-border)] bg-[var(--z-surface)] px-2 py-1 text-xs font-mono text-[var(--z-fg)]" }), _jsx("select", { value: c.op, disabled: disabled, onChange: (e) => update(i, { op: e.target.value }), className: "rounded border border-[var(--z-border)] bg-[var(--z-surface)] px-2 py-1 text-xs text-[var(--z-fg)]", children: OPS.map((op) => (_jsx("option", { value: op, children: op }, op))) }), c.op !== "exists" && c.op !== "not_exists" ? (_jsx("input", { type: "text", value: String((_a = c.value) !== null && _a !== void 0 ? _a : ""), disabled: disabled, placeholder: "value", onChange: (e) => update(i, { value: e.target.value }), className: "flex-1 min-w-[120px] rounded border border-[var(--z-border)] bg-[var(--z-surface)] px-2 py-1 text-xs text-[var(--z-fg)]" })) : null, _jsx("button", { type: "button", disabled: disabled, onClick: () => remove(i), className: "text-xs text-[var(--z-danger)] hover:underline disabled:opacity-50", children: "Remove" })] }, `${i}-${c.path}`));
                }) }))] }));
}
