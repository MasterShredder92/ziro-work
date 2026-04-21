"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { TRIGGER_CATALOG } from "@/lib/automation/workflows/types";
export function TriggerLibrary() {
    const [q, setQ] = useState("");
    const filtered = useMemo(() => {
        const needle = q.trim().toLowerCase();
        if (!needle)
            return TRIGGER_CATALOG;
        return TRIGGER_CATALOG.filter((t) => t.type.toLowerCase().includes(needle) ||
            t.label.toLowerCase().includes(needle) ||
            t.description.toLowerCase().includes(needle) ||
            t.category.toLowerCase().includes(needle));
    }, [q]);
    return (_jsxs("div", { className: "space-y-3", children: [_jsx("input", { value: q, onChange: (e) => setQ(e.target.value), placeholder: "Search triggers...", className: "w-full rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-2 text-sm text-[var(--z-fg)]" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: filtered.map((t) => (_jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4", children: [_jsxs("div", { className: "flex items-start justify-between gap-2", children: [_jsxs("div", { children: [_jsx("div", { className: "text-sm font-semibold text-[var(--z-fg)]", children: t.label }), _jsx("div", { className: "text-[10px] font-mono text-[var(--z-muted)] mt-0.5", children: t.type })] }), _jsx("span", { className: "inline-flex items-center rounded-full border border-[var(--z-border)] bg-white/5 px-2 py-0.5 text-[10px] text-[var(--z-muted)] uppercase", children: t.category })] }), _jsx("div", { className: "mt-2 text-xs text-[var(--z-muted)]", children: t.description })] }, t.type))) }), filtered.length === 0 ? (_jsx("div", { className: "text-xs text-[var(--z-muted)] italic", children: "No triggers match your search." })) : null] }));
}
