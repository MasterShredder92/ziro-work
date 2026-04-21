import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
function statusTone(status) {
    switch (status) {
        case "mastered":
            return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
        case "proficient":
            return "bg-sky-500/10 text-sky-400 border-sky-500/30";
        case "developing":
            return "bg-amber-500/10 text-amber-400 border-amber-500/30";
        case "not_started":
            return "bg-white/5 text-[var(--z-muted)] border-[var(--z-border)]";
    }
}
export function SkillList({ skills, title = "Skills", emptyLabel = "No skills tracked for this goal.", }) {
    if (skills.length === 0) {
        return (_jsx("div", { className: "rounded-lg border border-dashed border-[var(--z-border)] p-6 text-sm text-[var(--z-muted)]", children: emptyLabel }));
    }
    return (_jsxs("section", { className: "rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)]", children: [_jsx("header", { className: "border-b border-[var(--z-border)] px-4 py-3", children: _jsx("h3", { className: "text-sm font-semibold text-[var(--z-fg)]", children: title }) }), _jsx("ul", { className: "divide-y divide-[var(--z-border)]", children: skills.map((s) => (_jsx("li", { className: "px-4 py-3", children: _jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "truncate text-sm font-medium text-[var(--z-fg)]", children: s.title }), s.description ? (_jsx("div", { className: "truncate text-xs text-[var(--z-muted)]", children: s.description })) : null] }), _jsxs("div", { className: "flex items-center gap-2 shrink-0", children: [typeof s.mastery_score === "number" ? (_jsxs("span", { className: "text-xs font-medium text-[var(--z-fg)]", children: [s.mastery_score, "%"] })) : null, _jsx("span", { className: `rounded-md border px-2 py-0.5 text-[10px] uppercase tracking-wider ${statusTone(s.status)}`, children: s.status.replace("_", " ") })] })] }) }, s.id))) })] }));
}
