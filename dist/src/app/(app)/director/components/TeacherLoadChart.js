import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card } from "@/components/ui/Card";
export function TeacherLoadChart({ teachers, maxRows = 12, }) {
    const sorted = [...teachers]
        .sort((a, b) => b.weeklyMinutes - a.weeklyMinutes)
        .slice(0, maxRows);
    const maxMinutes = Math.max(1, ...sorted.map((t) => t.weeklyMinutes));
    return (_jsxs(Card, { variant: "elevated", padding: "md", radius: "lg", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { children: [_jsx("div", { className: "text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Teacher load" }), _jsx("div", { className: "text-lg font-semibold text-[var(--z-fg)]", children: "Weekly schedule utilization" })] }), _jsxs("div", { className: "text-xs text-[var(--z-muted)]", children: [teachers.length, " teachers"] })] }), sorted.length === 0 ? (_jsx("div", { className: "py-8 text-center text-sm text-[var(--z-muted)]", children: "No teachers assigned to this location." })) : (_jsx("div", { className: "space-y-2.5", children: sorted.map((t) => {
                    const pct = Math.round((t.weeklyMinutes / maxMinutes) * 100);
                    return (_jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center justify-between text-sm", children: [_jsx("div", { className: "truncate pr-3 text-[var(--z-fg)] font-medium", children: t.name }), _jsxs("div", { className: "text-xs text-[var(--z-muted)] tabular-nums shrink-0", children: [t.weeklyLessons, " lessons \u00B7 ", Math.round(t.weeklyMinutes / 60), "h"] })] }), _jsx("div", { className: "h-2 rounded-full bg-[color-mix(in_oklab,var(--z-surface),white_4%)] overflow-hidden", children: _jsx("div", { className: "h-full rounded-full", style: {
                                        width: `${pct}%`,
                                        background: "linear-gradient(90deg, #00ff88, color-mix(in oklab, #00ff88, #0094ff 45%))",
                                    } }) })] }, t.id));
                }) }))] }));
}
