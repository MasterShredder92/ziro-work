import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const STATUS_LABEL = {
    not_started: "Not started",
    in_progress: "In progress",
    completed: "Completed",
    needs_review: "Needs review",
};
const STATUS_TONE = {
    not_started: "border-[var(--z-border)] text-[var(--z-muted)]",
    in_progress: "border-[#00ff88]/30 text-[#00ff88]",
    completed: "border-[#00ff88]/50 text-[#00ff88] bg-[#00ff88]/10",
    needs_review: "border-amber-400/40 text-amber-300",
};
export function StudentProgressList({ completions, emptyMessage = "No student progress recorded yet.", }) {
    if (completions.length === 0) {
        return (_jsx("div", { className: "rounded-[var(--z-radius-md)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-4 text-center text-xs text-[var(--z-muted)]", children: emptyMessage }));
    }
    return (_jsx("ul", { className: "space-y-1.5", children: completions.map((entry) => (_jsx("li", { className: "rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-2", children: _jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsxs("div", { className: "min-w-0", children: [_jsxs("div", { className: "text-sm font-semibold text-[var(--z-fg)] truncate", children: ["Student ", entry.student_id.slice(0, 8)] }), _jsxs("div", { className: "text-xs text-[var(--z-muted)]", children: ["Updated ", new Date(entry.updated_at).toLocaleDateString(), entry.score !== null ? ` · score ${entry.score}` : ""] })] }), _jsx("span", { className: "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider " +
                            STATUS_TONE[entry.status], children: STATUS_LABEL[entry.status] })] }) }, entry.id))) }));
}
