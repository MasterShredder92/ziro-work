import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function FilesLoading({ label = "Loading…" }) {
    return (_jsx("div", { role: "status", "aria-live": "polite", className: "rounded-md border border-dashed border-[var(--z-border)] bg-[var(--z-surface)]/60 px-6 py-10 text-center text-sm text-[var(--z-muted)]", children: label }));
}
export function FilesError({ title = "Something went wrong", message, onRetry, }) {
    return (_jsxs("div", { className: "rounded-md border border-red-500/35 bg-red-500/10 px-4 py-5 text-sm", children: [_jsx("div", { className: "font-semibold text-red-300", children: title }), _jsx("p", { className: "mt-1 text-red-200/90", children: message }), onRetry ? (_jsx("button", { type: "button", onClick: onRetry, className: "mt-3 rounded-md border border-red-400/40 px-3 py-1.5 text-xs text-red-100 hover:bg-red-500/15", children: "Try again" })) : null] }));
}
