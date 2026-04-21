import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from "@/components/ui/utils";
/**
 * Consistent section chrome for the main dashboard column.
 */
export function DashboardSection({ id, title, description, children, className, withSurface = true, surfaceClassName, }) {
    return (_jsxs("section", { id: id, className: cn("space-y-4", className), children: [_jsx("div", { className: "flex flex-col gap-0.5 sm:flex-row sm:items-end sm:justify-between", children: _jsxs("div", { children: [_jsx("h2", { className: "text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--z-muted)]", children: title }), description ? (_jsx("p", { className: "mt-1 max-w-2xl text-xs leading-relaxed text-[color-mix(in_oklab,var(--z-fg),transparent_42%)]", children: description })) : null] }) }), withSurface ? (_jsx("div", { className: cn("rounded-2xl border border-[color-mix(in_oklab,var(--z-border),transparent_12%)] bg-[color-mix(in_oklab,var(--z-surface),transparent_22%)] p-4 shadow-[inset_0_1px_0_0_color-mix(in_oklab,white,transparent_94%)] backdrop-blur-sm sm:p-5", surfaceClassName), children: children })) : (children)] }));
}
