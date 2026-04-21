import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function BrandingForbidden({ variant = "full", }) {
    if (variant === "compact") {
        return (_jsx("div", { className: "rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center text-sm text-[var(--z-muted)]", children: "Forbidden" }));
    }
    return (_jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center", children: [_jsx("div", { className: "text-base font-semibold text-[var(--z-fg)]", children: "Forbidden" }), _jsx("div", { className: "mt-2 text-sm text-[var(--z-muted)]", children: "You do not have access to Branding OS." })] }));
}
