import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from "@/components/ui/utils";
export function BreadcrumbPlaceholder() {
    return (_jsx("div", { className: "text-xs text-[#606068]", children: "Workspace" }));
}
export function PageShell({ title, breadcrumbs, showBreadcrumb = true, shellClassName, mainClassName, children, }) {
    return (_jsxs("div", { className: cn("h-full overflow-y-auto overflow-x-hidden p-6", shellClassName), children: [showBreadcrumb ? (_jsx("div", { className: "mb-4", children: breadcrumbs !== null && breadcrumbs !== void 0 ? breadcrumbs : _jsx(BreadcrumbPlaceholder, {}) })) : null, title ? (_jsx("h1", { className: "text-xl font-extrabold text-[#f0f0f0]", children: title })) : null, _jsx("div", { className: cn("mt-6", mainClassName), children: children !== null && children !== void 0 ? children : (_jsxs("div", { className: "space-y-2", role: "status", "aria-live": "polite", "aria-busy": "true", children: [_jsx("div", { className: "h-4 w-32 animate-pulse rounded bg-white/10" }), _jsx("div", { className: "h-3 w-full max-w-lg animate-pulse rounded bg-white/5" }), _jsx("div", { className: "h-3 w-4/5 max-w-md animate-pulse rounded bg-white/5" })] })) })] }));
}
