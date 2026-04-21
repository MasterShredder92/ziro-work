"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from "react";
export function NotesPopoverEditor({ value, onChange, onSave, onCancel, }) {
    const rootRef = useRef(null);
    const textareaRef = useRef(null);
    useEffect(() => {
        var _a;
        (_a = textareaRef.current) === null || _a === void 0 ? void 0 : _a.focus();
    }, []);
    return (_jsxs("div", { ref: rootRef, className: "absolute right-0 z-40 mt-1 w-80 rounded-md border border-[var(--z-border,#1c1c1e)] bg-[var(--z-surface,#0a0a0c)] p-2 shadow-xl", onKeyDown: (event) => {
            var _a;
            if (event.key === "Escape") {
                event.preventDefault();
                onCancel();
                return;
            }
            if (event.key === "Enter" && event.ctrlKey) {
                event.preventDefault();
                onSave();
                return;
            }
            if (event.key !== "Tab")
                return;
            const focusables = (_a = rootRef.current) === null || _a === void 0 ? void 0 : _a.querySelectorAll('textarea,button,[href],[tabindex]:not([tabindex="-1"])');
            if (!focusables || focusables.length === 0)
                return;
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            const active = document.activeElement;
            if (event.shiftKey && active === first) {
                event.preventDefault();
                last === null || last === void 0 ? void 0 : last.focus();
            }
            else if (!event.shiftKey && active === last) {
                event.preventDefault();
                first === null || first === void 0 ? void 0 : first.focus();
            }
        }, children: [_jsx("textarea", { ref: textareaRef, "aria-label": "Notes editor", value: value, onChange: (event) => onChange(event.target.value), rows: 6, className: "w-full resize-y rounded border border-[var(--z-border,#1c1c1e)] bg-black px-2 py-1.5 text-sm text-[var(--z-fg,#f0f0f0)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--z-accent,#00ff88)]" }), _jsxs("div", { className: "mt-2 flex items-center justify-end gap-2", children: [_jsx("button", { type: "button", onClick: onCancel, className: "rounded px-2 py-1 text-xs text-[var(--z-muted,#909098)] hover:bg-white/5", children: "Cancel" }), _jsx("button", { type: "button", onClick: onSave, className: "rounded bg-[var(--z-accent,#00ff88)]/15 px-2 py-1 text-xs font-semibold text-[var(--z-accent,#00ff88)]", children: "Save" })] })] }));
}
