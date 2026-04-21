"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
export function MoveToFolderModal({ open, folders, onClose, onConfirm, title = "Move to folder", }) {
    const [q, setQ] = useState("");
    const flat = useMemo(() => {
        const sorted = [...folders].sort((a, b) => a.path.localeCompare(b.path));
        const needle = q.trim().toLowerCase();
        if (!needle)
            return sorted;
        return sorted.filter((f) => f.name.toLowerCase().includes(needle) ||
            f.path.toLowerCase().includes(needle));
    }, [folders, q]);
    if (!open)
        return null;
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 transition-opacity duration-200", children: _jsxs("div", { className: "flex max-h-[85vh] w-full max-w-md flex-col rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-4 shadow-xl", children: [_jsxs("div", { className: "mb-3 flex items-center justify-between", children: [_jsx("h2", { className: "text-base font-semibold text-[var(--z-fg)]", children: title }), _jsx("button", { type: "button", onClick: onClose, className: "rounded p-1 text-[var(--z-muted)] hover:bg-white/[0.05]", "aria-label": "Close", children: "\u2715" })] }), _jsx("input", { value: q, onChange: (e) => setQ(e.target.value), placeholder: "Search folders\u2026", className: "mb-3 rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-sm text-[var(--z-fg)]" }), _jsxs("div", { className: "min-h-0 flex-1 overflow-y-auto rounded border border-[var(--z-border)] p-2", children: [_jsx("button", { type: "button", onClick: () => onConfirm(null), className: "mb-2 w-full rounded border border-dashed border-[var(--z-border)] px-2 py-2 text-left text-xs text-[var(--z-muted)] hover:bg-white/[0.03]", children: "Root (no folder)" }), flat.map((f) => (_jsxs("button", { type: "button", onClick: () => onConfirm(f.id), className: "mb-1 w-full rounded px-2 py-2 text-left text-sm text-[var(--z-fg)] hover:bg-white/[0.05]", children: [_jsx("div", { className: "font-medium", children: f.name }), _jsx("div", { className: "text-[11px] text-[var(--z-muted)]", children: f.path })] }, f.id)))] })] }) }));
}
