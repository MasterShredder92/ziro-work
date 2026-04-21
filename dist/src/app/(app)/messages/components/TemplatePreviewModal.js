"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from "react";
export function TemplatePreviewModal({ open, onClose, templateName, renderedSubject, renderedBody, }) {
    useEffect(() => {
        if (!open)
            return;
        function onKey(e) {
            if (e.key === "Escape")
                onClose();
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);
    if (!open)
        return null;
    const subjectEmpty = !renderedSubject.trim();
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4", role: "dialog", "aria-modal": "true", "aria-labelledby": "template-preview-title", onClick: (e) => {
            if (e.target === e.currentTarget)
                onClose();
        }, children: _jsxs("div", { className: "flex max-h-[min(85vh,720px)] w-full max-w-lg flex-col gap-3 rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-5 shadow-xl", children: [_jsxs("header", { className: "flex shrink-0 items-center justify-between gap-2", children: [_jsx("h2", { id: "template-preview-title", className: "text-base font-semibold text-[var(--z-fg)]", children: "Template preview" }), _jsx("button", { type: "button", onClick: onClose, className: "rounded px-2 py-1 text-sm text-[var(--z-muted)] hover:bg-[var(--z-surface-hover)]", "aria-label": "Close preview", children: "\u00D7" })] }), _jsxs("p", { className: "shrink-0 text-xs text-[var(--z-muted)]", children: [_jsx("span", { className: "font-medium text-[var(--z-fg)]", children: templateName }), _jsx("span", { className: "text-[var(--z-muted)]", children: " \u00B7 read-only" })] }), _jsxs("div", { className: "flex min-h-0 flex-1 flex-col gap-2 overflow-hidden", children: [_jsxs("div", { className: "shrink-0", children: [_jsx("div", { className: "text-[10px] font-semibold uppercase tracking-wide text-[var(--z-muted)]", children: "Subject" }), subjectEmpty ? (_jsx("p", { className: "text-sm italic text-[var(--z-muted)]", children: "(No subject in this template)" })) : (_jsx("p", { className: "whitespace-pre-wrap text-sm text-[var(--z-fg)]", children: renderedSubject }))] }), _jsxs("div", { className: "flex min-h-0 flex-1 flex-col gap-1", children: [_jsx("div", { className: "shrink-0 text-[10px] font-semibold uppercase tracking-wide text-[var(--z-muted)]", children: "Body" }), _jsx("div", { className: "min-h-[120px] flex-1 overflow-y-auto rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2", children: _jsx("pre", { className: "whitespace-pre-wrap break-words font-sans text-sm text-[var(--z-fg)]", children: renderedBody }) })] })] }), _jsx("footer", { className: "shrink-0 flex justify-end", children: _jsx("button", { type: "button", onClick: onClose, className: "rounded-md border border-[var(--z-border)] px-3 py-1.5 text-sm text-[var(--z-fg)] hover:bg-[var(--z-surface-hover)]", children: "Close" }) })] }) }));
}
