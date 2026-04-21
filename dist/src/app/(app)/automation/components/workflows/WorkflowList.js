import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
function formatRelative(iso) {
    if (!iso)
        return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime()))
        return "—";
    return d.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}
function StatusPill({ status }) {
    const s = status.toLowerCase();
    const className = s === "active"
        ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
        : s === "paused"
            ? "border-amber-500/30 bg-amber-500/15 text-amber-300"
            : s === "archived"
                ? "border-[var(--z-border)] bg-white/5 text-[var(--z-muted)]"
                : "border-[var(--z-border)] bg-white/5 text-[var(--z-muted)]";
    return (_jsx("span", { className: `inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${className}`, children: status }));
}
export function WorkflowList({ workflows, emptyMessage = "No workflows yet. Create one to get started.", }) {
    if (!workflows.length) {
        return (_jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center", children: [_jsx("div", { className: "text-base font-semibold text-[var(--z-fg)]", children: "No workflows" }), _jsx("div", { className: "mt-2 text-sm text-[var(--z-muted)]", children: emptyMessage })] }));
    }
    return (_jsx("div", { className: "overflow-hidden rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)]", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "bg-[color-mix(in_oklab,var(--z-surface-2),transparent_12%)] text-[11px] uppercase tracking-wider text-[var(--z-muted)]", children: _jsxs("tr", { children: [_jsx("th", { className: "text-left font-semibold px-4 py-2", children: "Name" }), _jsx("th", { className: "text-left font-semibold px-4 py-2", children: "Trigger" }), _jsx("th", { className: "text-left font-semibold px-4 py-2", children: "Actions" }), _jsx("th", { className: "text-left font-semibold px-4 py-2", children: "Status" }), _jsx("th", { className: "text-left font-semibold px-4 py-2", children: "Last run" }), _jsx("th", { className: "text-right font-semibold px-4 py-2", children: "Updated" })] }) }), _jsx("tbody", { children: workflows.map((wf) => {
                        var _a, _b;
                        return (_jsxs("tr", { className: "border-t border-[var(--z-border)] hover:bg-white/5", children: [_jsxs("td", { className: "px-4 py-3", children: [_jsx(Link, { href: `/automation/workflows/${wf.id}`, className: "font-medium text-[var(--z-fg)] hover:text-[var(--z-accent)]", children: wf.name }), wf.description ? (_jsx("div", { className: "text-xs text-[var(--z-muted)] mt-0.5 line-clamp-1", children: wf.description })) : null] }), _jsx("td", { className: "px-4 py-3 text-[var(--z-muted)] font-mono text-xs", children: (_b = (_a = wf.trigger) === null || _a === void 0 ? void 0 : _a.type) !== null && _b !== void 0 ? _b : "—" }), _jsx("td", { className: "px-4 py-3 text-[var(--z-muted)] text-xs", children: wf.actions.length }), _jsx("td", { className: "px-4 py-3", children: _jsx(StatusPill, { status: wf.status }) }), _jsx("td", { className: "px-4 py-3 text-[var(--z-muted)] text-xs", children: wf.last_run_status ? (_jsxs("div", { children: [_jsx("span", { className: "font-mono", children: wf.last_run_status }), _jsx("div", { className: "text-[10px] opacity-70", children: formatRelative(wf.last_run_at) })] })) : ("—") }), _jsx("td", { className: "px-4 py-3 text-right text-[var(--z-muted)] text-xs", children: formatRelative(wf.updated_at) })] }, wf.id));
                    }) })] }) }));
}
