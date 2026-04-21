import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
function formatDate(iso) {
    if (!iso)
        return "—";
    const d = new Date(`${iso}T00:00:00`);
    return d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}
function statusClass(status) {
    if (status === "completed")
        return "bg-emerald-500/10 text-emerald-400";
    if (status === "missed")
        return "bg-red-500/10 text-red-400";
    return "bg-white/5 text-[var(--z-muted)]";
}
export function LessonList({ lessons, emptyLabel = "No lesson history yet.", maxRows, }) {
    const rows = typeof maxRows === "number" ? lessons.slice(0, maxRows) : lessons;
    if (rows.length === 0) {
        return (_jsx("div", { className: "rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] p-6 text-sm text-[var(--z-muted)]", children: emptyLabel }));
    }
    return (_jsx("div", { className: "overflow-hidden rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)]", children: _jsx("ul", { className: "divide-y divide-[var(--z-border)]", children: rows.map((l) => (_jsxs("li", { className: "p-4", children: [_jsxs("div", { className: "flex items-center justify-between gap-4", children: [_jsxs("div", { className: "min-w-0", children: [_jsxs("div", { className: "text-sm font-semibold text-[var(--z-fg)]", children: [formatDate(l.block_date), l.instrument ? ` · ${l.instrument}` : ""] }), _jsxs("div", { className: "text-xs text-[var(--z-muted)]", children: ["Engagement:", " ", typeof l.engagement_level === "number"
                                                ? `${l.engagement_level}/5`
                                                : "—", l.progress_indicator ? ` · ${l.progress_indicator}` : ""] })] }), l.status ? (_jsx("span", { className: `shrink-0 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide ${statusClass(l.status)}`, children: l.status })) : null] }), l.lesson_notes ? (_jsx("p", { className: "mt-2 line-clamp-3 text-xs text-[var(--z-muted)]", children: l.lesson_notes })) : null, l.worked_on.length > 0 ? (_jsx("div", { className: "mt-2 flex flex-wrap gap-1", children: l.worked_on.map((w, i) => (_jsx("span", { className: "rounded-full border border-[var(--z-border)] px-2 py-0.5 text-[10px] text-[var(--z-muted)]", children: w }, `${l.id}-${i}`))) })) : null] }, l.id))) }) }));
}
