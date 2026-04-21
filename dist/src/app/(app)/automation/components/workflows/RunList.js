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
function formatDuration(ms) {
    if (typeof ms !== "number" || ms < 0)
        return "—";
    if (ms < 1000)
        return `${ms}ms`;
    if (ms < 60000)
        return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.round(ms / 1000)}s`;
}
function StatusPill({ status }) {
    const s = status.toLowerCase();
    let cn = "border-[var(--z-border)] bg-white/5 text-[var(--z-muted)]";
    if (s === "succeeded")
        cn = "border-emerald-500/30 bg-emerald-500/15 text-emerald-300";
    else if (s === "running")
        cn = "border-sky-500/30 bg-sky-500/15 text-sky-300";
    else if (s === "queued")
        cn = "border-[var(--z-border)] bg-white/5 text-[var(--z-muted)]";
    else if (s === "failed")
        cn = "border-rose-500/30 bg-rose-500/15 text-rose-300";
    else if (s === "dead_letter")
        cn = "border-red-500/40 bg-red-500/20 text-red-300";
    else if (s === "cancelled")
        cn = "border-amber-500/30 bg-amber-500/15 text-amber-300";
    return (_jsx("span", { className: `inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${cn}`, children: status }));
}
export function RunList({ runs, showWorkflow = false, emptyMessage = "No runs yet.", }) {
    if (!runs.length) {
        return (_jsx("div", { className: "rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-8 text-center", children: _jsx("div", { className: "text-sm text-[var(--z-muted)]", children: emptyMessage }) }));
    }
    return (_jsx("div", { className: "overflow-hidden rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)]", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "bg-[color-mix(in_oklab,var(--z-surface-2),transparent_12%)] text-[11px] uppercase tracking-wider text-[var(--z-muted)]", children: _jsxs("tr", { children: [_jsx("th", { className: "text-left font-semibold px-4 py-2", children: "Run" }), showWorkflow ? (_jsx("th", { className: "text-left font-semibold px-4 py-2", children: "Workflow" })) : null, _jsx("th", { className: "text-left font-semibold px-4 py-2", children: "Trigger" }), _jsx("th", { className: "text-left font-semibold px-4 py-2", children: "Status" }), _jsx("th", { className: "text-left font-semibold px-4 py-2", children: "Attempt" }), _jsx("th", { className: "text-left font-semibold px-4 py-2", children: "Duration" }), _jsx("th", { className: "text-right font-semibold px-4 py-2", children: "Started" })] }) }), _jsx("tbody", { children: runs.map((run) => (_jsxs("tr", { className: "border-t border-[var(--z-border)] hover:bg-white/5", children: [_jsx("td", { className: "px-4 py-3 font-mono text-xs", children: _jsx(Link, { href: `/automation/runs/${run.id}`, className: "text-[var(--z-fg)] hover:text-[var(--z-accent)]", children: run.id.slice(0, 10) }) }), showWorkflow ? (_jsx("td", { className: "px-4 py-3 font-mono text-xs text-[var(--z-muted)]", children: run.workflow_id.slice(0, 10) })) : null, _jsx("td", { className: "px-4 py-3 text-[var(--z-muted)] font-mono text-xs", children: run.trigger_type }), _jsx("td", { className: "px-4 py-3", children: _jsx(StatusPill, { status: run.status }) }), _jsxs("td", { className: "px-4 py-3 text-[var(--z-muted)] text-xs", children: [run.attempt, "/", run.max_attempts] }), _jsx("td", { className: "px-4 py-3 text-[var(--z-muted)] text-xs", children: formatDuration(run.duration_ms) }), _jsx("td", { className: "px-4 py-3 text-right text-[var(--z-muted)] text-xs", children: formatRelative(run.started_at) })] }, run.id))) })] }) }));
}
