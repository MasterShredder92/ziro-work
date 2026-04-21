import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
export function LessonList({ lessons, emptyMessage = "No lessons yet.", }) {
    if (lessons.length === 0) {
        return (_jsx("div", { className: "rounded-[var(--z-radius-md)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-4 text-center text-xs text-[var(--z-muted)]", children: emptyMessage }));
    }
    return (_jsx("ul", { className: "space-y-1.5", children: lessons.map((lesson) => (_jsx("li", { children: _jsxs(Link, { href: `/curriculum/lesson/${lesson.id}`, className: "flex items-center justify-between gap-3 rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-2 hover:border-[color-mix(in_oklab,var(--z-accent),transparent_45%)] transition-colors", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "text-sm font-semibold text-[var(--z-fg)] truncate", children: lesson.title }), lesson.objective ? (_jsx("div", { className: "text-xs text-[var(--z-muted)] line-clamp-1", children: lesson.objective })) : null] }), _jsxs("div", { className: "shrink-0 flex items-center gap-2 text-[10px] text-[var(--z-muted)]", children: [lesson.difficulty ? (_jsx("span", { className: "rounded-full border border-[var(--z-border)] px-1.5 py-0.5 uppercase tracking-wider", children: lesson.difficulty })) : null, typeof lesson.estimated_minutes === "number" ? (_jsxs("span", { children: [lesson.estimated_minutes, "m"] })) : null] })] }) }, lesson.id))) }));
}
