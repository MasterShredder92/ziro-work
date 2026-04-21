"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from "react";
export function normalizeFolderDescription(value) {
    const trimmed = (value !== null && value !== void 0 ? value : "").trim();
    return trimmed.length > 0 ? trimmed : null;
}
export function folderDescriptionPreview(value, max = 60) {
    const normalized = normalizeFolderDescription(value);
    if (!normalized)
        return null;
    if (normalized.length <= max)
        return normalized;
    return `${normalized.slice(0, max - 1)}…`;
}
export function FolderDescriptionEditor({ value, onChange, onSave, onCancel, }) {
    const textareaRef = useRef(null);
    const cancelRef = useRef(null);
    const saveRef = useRef(null);
    useEffect(() => {
        const el = textareaRef.current;
        if (!el)
            return;
        el.focus();
        el.selectionStart = el.value.length;
        el.selectionEnd = el.value.length;
        el.style.height = "auto";
        el.style.height = `${el.scrollHeight}px`;
    }, []);
    const resize = () => {
        const el = textareaRef.current;
        if (!el)
            return;
        el.style.height = "auto";
        el.style.height = `${el.scrollHeight}px`;
    };
    const focusables = () => [textareaRef.current, cancelRef.current, saveRef.current].filter(Boolean);
    return (_jsxs("div", { className: "w-[260px] rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] p-2 shadow-lg", role: "dialog", "aria-label": "Edit folder description", onMouseDown: (e) => e.stopPropagation(), onClick: (e) => e.stopPropagation(), onKeyDown: (e) => {
            if (e.key === "Escape") {
                e.preventDefault();
                onCancel();
                return;
            }
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                onSave();
                return;
            }
            if (e.key === "Tab") {
                const els = focusables();
                if (els.length === 0)
                    return;
                const active = document.activeElement;
                const idx = active ? els.indexOf(active) : -1;
                const next = e.shiftKey
                    ? els[(idx - 1 + els.length) % els.length]
                    : els[(idx + 1) % els.length];
                if (next) {
                    e.preventDefault();
                    next.focus();
                }
            }
        }, children: [_jsx("div", { className: "mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Description" }), _jsx("textarea", { ref: textareaRef, value: value !== null && value !== void 0 ? value : "", rows: 3, placeholder: "Add a folder description\u2026", className: "max-h-40 min-h-[72px] w-full resize-none rounded border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-xs text-[var(--z-fg)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--z-accent)]", onChange: (e) => {
                    onChange(e.target.value);
                    resize();
                } }), _jsxs("div", { className: "mt-2 flex justify-end gap-1.5", children: [_jsx("button", { ref: cancelRef, type: "button", className: "rounded border border-[var(--z-border)] px-2 py-1 text-[11px] text-[var(--z-muted)] hover:bg-white/[0.05] hover:text-[var(--z-fg)]", onClick: onCancel, children: "Cancel" }), _jsx("button", { ref: saveRef, type: "button", className: "rounded bg-[var(--z-accent)] px-2 py-1 text-[11px] font-semibold text-black hover:opacity-90", onClick: onSave, children: "Save" })] }), _jsx("div", { className: "mt-1 text-[10px] text-[var(--z-muted)]", children: "Ctrl+Enter to save" })] }));
}
