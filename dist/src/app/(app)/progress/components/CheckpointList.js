import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
function statusTone(status) {
    switch (status) {
        case "passed":
            return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
        case "in_progress":
            return "bg-sky-500/10 text-sky-400 border-sky-500/30";
        case "pending":
            return "bg-white/5 text-[var(--z-muted)] border-[var(--z-border)]";
        case "needs_review":
            return "bg-amber-500/10 text-amber-400 border-amber-500/30";
        case "failed":
            return "bg-rose-500/10 text-rose-400 border-rose-500/30";
    }
}
export function CheckpointList({ checkpoints, title = "Checkpoints", emptyLabel = "No checkpoints assigned yet.", }) {
    if (checkpoints.length === 0) {
        return (_jsx("div", { className: "rounded-lg border border-dashed border-[var(--z-border)] p-6 text-sm text-[var(--z-muted)]", children: emptyLabel }));
    }
    return (_jsxs("section", { className: "rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)]", children: [_jsx("header", { className: "border-b border-[var(--z-border)] px-4 py-3", children: _jsx("h3", { className: "text-sm font-semibold text-[var(--z-fg)]", children: title }) }), _jsx("ul", { className: "divide-y divide-[var(--z-border)]", children: checkpoints.map((c) => (_jsxs("li", { className: "px-4 py-3", children: [_jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "truncate text-sm font-medium text-[var(--z-fg)]", children: c.title }), c.description ? (_jsx("div", { className: "text-xs text-[var(--z-muted)]", children: c.description })) : null, c.teacher_feedback ? (_jsxs("div", { className: "mt-2 rounded-md border border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface-2),transparent_30%)] px-3 py-2 text-xs text-[var(--z-fg)]", children: [_jsx("span", { className: "text-[var(--z-muted)]", children: "Teacher:" }), " ", c.teacher_feedback] })) : null] }), _jsxs("div", { className: "flex items-center gap-2 shrink-0", children: [typeof c.score === "number" ? (_jsx("span", { className: "text-xs font-medium text-[var(--z-fg)]", children: c.score })) : null, _jsx("span", { className: `rounded-md border px-2 py-0.5 text-[10px] uppercase tracking-wider ${statusTone(c.status)}`, children: c.status.replace("_", " ") })] })] }), c.due_date ? (_jsxs("div", { className: "mt-1 text-[11px] text-[var(--z-muted)]", children: ["Due: ", new Date(c.due_date).toLocaleDateString()] })) : null] }, c.id))) })] }));
}
