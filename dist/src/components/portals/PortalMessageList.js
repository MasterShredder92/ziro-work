"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { EmptyState } from "@/components/system/SurfaceStates";
function formatRelative(iso) {
    if (!iso)
        return "--";
    const then = new Date(iso).getTime();
    if (!Number.isFinite(then))
        return "--";
    const diff = Date.now() - then;
    const minutes = Math.round(diff / 60000);
    if (minutes < 1)
        return "just now";
    if (minutes < 60)
        return `${minutes}m ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24)
        return `${hours}h ago`;
    const days = Math.round(hours / 24);
    if (days < 7)
        return `${days}d ago`;
    return new Date(iso).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
    });
}
export function PortalMessageList({ rows, title = "Messages", maxRows = 10, emptyLabel = "No recent messages.", }) {
    const data = rows.slice(0, maxRows);
    return (_jsxs("section", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)]", children: [_jsxs("header", { className: "flex items-center justify-between border-b border-[var(--z-border)] px-4 py-3", children: [_jsx("h2", { className: "text-sm font-semibold text-[var(--z-fg)]", children: title }), _jsxs("span", { className: "text-xs text-[var(--z-muted)]", children: [data.length, " ", data.length === 1 ? "thread" : "threads"] })] }), data.length === 0 ? (_jsx("div", { className: "p-4", children: _jsx(EmptyState, { title: emptyLabel, description: "Conversations will appear as soon as they start." }) })) : (_jsx("ul", { className: "divide-y divide-[var(--z-border)]", role: "list", children: data.map((row) => (_jsxs("li", { className: "flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-start sm:justify-between z-hover-micro-subtle", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "truncate text-sm font-medium text-[var(--z-fg)]", children: row.title }), row.subtitle ? (_jsx("div", { className: "truncate text-xs text-[var(--z-muted)]", children: row.subtitle })) : null, row.preview ? (_jsx("div", { className: "line-clamp-2 text-xs text-[var(--z-muted)]", children: row.preview })) : null] }), _jsx("span", { className: "shrink-0 text-xs text-[var(--z-muted)]", children: formatRelative(row.updatedAt) })] }, row.id))) }))] }));
}
