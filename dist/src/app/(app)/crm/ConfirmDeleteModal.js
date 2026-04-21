"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from "react";
export function ConfirmDeleteModal({ open, title, body, confirmLabel = "Delete", busy, onConfirm, onCancel, }) {
    const confirmRef = useRef(null);
    useEffect(() => {
        var _a;
        if (!open)
            return;
        (_a = confirmRef.current) === null || _a === void 0 ? void 0 : _a.focus();
    }, [open]);
    if (!open)
        return null;
    return (_jsx("div", { className: "fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4", role: "presentation", onMouseDown: (e) => {
            if (e.target === e.currentTarget)
                onCancel();
        }, children: _jsxs("div", { role: "dialog", "aria-modal": "true", "aria-labelledby": "bulk-delete-title", className: "w-full max-w-md rounded-lg border border-[var(--z-border,#1c1c1e)] bg-[var(--z-surface,#0a0a0c)] p-5 shadow-xl", children: [_jsx("h2", { id: "bulk-delete-title", className: "text-lg font-semibold text-[var(--z-fg,#f0f0f0)]", children: title }), _jsx("p", { className: "mt-2 text-sm text-[var(--z-muted,#909098)]", children: body }), _jsxs("div", { className: "mt-6 flex justify-end gap-2", children: [_jsx("button", { type: "button", onClick: onCancel, disabled: busy, className: "rounded-md border border-[var(--z-border,#1c1c1e)] px-3 py-2 text-sm font-medium text-[var(--z-fg,#e0e0e0)] hover:bg-white/5 disabled:opacity-50", children: "Cancel" }), _jsx("button", { ref: confirmRef, type: "button", onClick: onConfirm, disabled: busy, className: "rounded-md bg-red-600/90 px-3 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50", children: busy ? "Working…" : confirmLabel })] })] }) }));
}
