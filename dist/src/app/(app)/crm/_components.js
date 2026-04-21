import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
export { TableShell } from "./table-shell";
export function CRMLayout({ title, subtitle, actions, children, }) {
    return (_jsxs("div", { className: "h-full overflow-y-auto overflow-x-hidden p-6", children: [_jsxs("div", { className: "mb-6 flex items-start justify-between gap-4", children: [_jsxs("div", { children: [_jsx("div", { className: "text-xs uppercase tracking-wider text-[var(--z-muted-2,#606068)]", children: "CRM OS" }), _jsx("h1", { className: "text-2xl font-extrabold text-[var(--z-fg,#f0f0f0)]", children: title }), subtitle ? (_jsx("div", { className: "mt-1 text-sm text-[var(--z-muted,#909098)]", children: subtitle })) : null] }), _jsx("div", { className: "flex items-center gap-2", children: actions })] }), children] }));
}
export function CRMNav({ current }) {
    const items = [
        { id: "home", href: "/crm", label: "Dashboard" },
        { id: "contacts", href: "/crm/contacts", label: "Contacts" },
        { id: "students", href: "/crm/students", label: "Students" },
        { id: "families", href: "/crm/families", label: "Families" },
        { id: "teachers", href: "/crm/teachers", label: "Teachers" },
        { id: "enrollments", href: "/crm/enrollments", label: "Enrollments" },
        { id: "leads", href: "/crm/leads", label: "Leads" },
    ];
    return (_jsx("nav", { className: "mb-6 flex flex-wrap items-center gap-1 border-b border-[#1c1c1e] pb-2", children: items.map((it) => (_jsx(Link, { href: it.href, className: `rounded-md px-3 py-1.5 text-sm font-semibold ${it.id === current
                ? "bg-[var(--z-accent,#00ff88)]/10 text-[var(--z-accent,#00ff88)]"
                : "text-[var(--z-muted,#909098)] hover:bg-white/5 hover:text-white"}`, children: it.label }, it.id))) }));
}
export function KpiTile({ label, value, hint, }) {
    return (_jsxs("div", { className: "rounded-lg border border-[var(--z-border,#1c1c1e)] bg-[var(--z-surface,#0a0a0c)] p-4", children: [_jsx("div", { className: "text-xs uppercase tracking-wider text-[var(--z-muted-2,#606068)]", children: label }), _jsx("div", { className: "mt-1 text-2xl font-extrabold text-[var(--z-fg,#f0f0f0)]", children: value }), hint ? (_jsx("div", { className: "mt-1 text-xs text-[var(--z-muted,#707078)]", children: hint })) : null] }));
}
export function KpiSkeletonGrid() {
    return (_jsx("div", { className: "grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6", children: Array.from({ length: 6 }).map((_, i) => (_jsxs("div", { className: "animate-pulse rounded-lg border border-[var(--z-border,#1c1c1e)] bg-[var(--z-surface,#0a0a0c)] p-4", children: [_jsx("div", { className: "h-3 w-24 rounded bg-white/10" }), _jsx("div", { className: "mt-3 h-8 w-16 rounded bg-white/10" })] }, i))) }));
}
export function TableSkeleton({ rows = 5, cols = 5, }) {
    return (_jsxs("div", { className: "overflow-hidden rounded-lg border border-[var(--z-border,#1c1c1e)] bg-[var(--z-surface,#0a0a0c)]", children: [_jsx("div", { className: "border-b border-[var(--z-border,#1c1c1e)] p-3", children: _jsx("div", { className: "flex gap-2", children: Array.from({ length: cols }).map((_, i) => (_jsx("div", { className: "h-3 flex-1 animate-pulse rounded bg-white/10" }, i))) }) }), _jsx("div", { className: "divide-y divide-[var(--z-border,#1c1c1e)]", children: Array.from({ length: rows }).map((_, r) => (_jsx("div", { className: "flex gap-2 px-4 py-3", children: Array.from({ length: cols }).map((_, c) => (_jsx("div", { className: "h-3 flex-1 animate-pulse rounded bg-white/10" }, c))) }, r))) })] }));
}
export function EmptyState({ title, body, }) {
    return (_jsxs("div", { className: "rounded-lg border border-dashed border-[var(--z-border,#1c1c1e)] bg-[var(--z-surface,#0a0a0c)] p-8 text-center", children: [_jsx("div", { className: "text-sm font-semibold text-[var(--z-fg-muted,#d4d4d4)]", children: title }), body ? (_jsx("div", { className: "mt-2 text-xs text-[var(--z-muted,#909098)]", children: body })) : null] }));
}
export function PageErrorState({ title, message, onRetry, }) {
    return (_jsxs("div", { className: "flex min-h-[40vh] flex-col items-center justify-center gap-3 p-8 text-center", children: [_jsx("div", { className: "text-lg font-semibold text-[var(--z-fg,#f0f0f0)]", children: title }), _jsx("p", { className: "max-w-md text-sm text-[var(--z-muted,#909098)]", children: message }), onRetry ? (_jsx("button", { type: "button", onClick: onRetry, className: "rounded-md bg-[var(--z-accent,#00ff88)]/15 px-4 py-2 text-sm font-semibold text-[var(--z-accent,#00ff88)] hover:bg-[var(--z-accent,#00ff88)]/25", children: "Try again" })) : null] }));
}
