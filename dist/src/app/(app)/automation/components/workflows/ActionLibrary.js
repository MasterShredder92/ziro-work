"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { ACTION_CATALOG } from "@/lib/automation/workflows/types";
export function ActionLibrary() {
    const [q, setQ] = useState("");
    const filtered = useMemo(() => {
        const needle = q.trim().toLowerCase();
        if (!needle)
            return ACTION_CATALOG;
        return ACTION_CATALOG.filter((a) => a.type.toLowerCase().includes(needle) ||
            a.label.toLowerCase().includes(needle) ||
            a.description.toLowerCase().includes(needle) ||
            a.category.toLowerCase().includes(needle));
    }, [q]);
    return (_jsxs("div", { className: "space-y-3", children: [_jsx("input", { value: q, onChange: (e) => setQ(e.target.value), placeholder: "Search actions...", className: "w-full rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-2 text-sm text-[var(--z-fg)]" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: filtered.map((a) => (_jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4", children: [_jsxs("div", { className: "flex items-start justify-between gap-2", children: [_jsxs("div", { children: [_jsx("div", { className: "text-sm font-semibold text-[var(--z-fg)]", children: a.label }), _jsx("div", { className: "text-[10px] font-mono text-[var(--z-muted)] mt-0.5", children: a.type })] }), _jsx("span", { className: "inline-flex items-center rounded-full border border-[var(--z-border)] bg-white/5 px-2 py-0.5 text-[10px] text-[var(--z-muted)] uppercase", children: a.category })] }), _jsx("div", { className: "mt-2 text-xs text-[var(--z-muted)]", children: a.description }), a.configSchema ? (_jsxs("div", { className: "mt-2 text-[10px] text-[var(--z-muted)]", children: ["Config:", " ", Object.keys(a.configSchema)
                                    .map((k) => { var _a, _b; return k + (((_b = (_a = a.configSchema) === null || _a === void 0 ? void 0 : _a[k]) === null || _b === void 0 ? void 0 : _b.required) ? "*" : ""); })
                                    .join(", ")] })) : null] }, a.type))) }), filtered.length === 0 ? (_jsx("div", { className: "text-xs text-[var(--z-muted)] italic", children: "No actions match your search." })) : null] }));
}
