import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { MaterialList } from "./MaterialList";
import { StudentProgressList } from "./StudentProgressList";
function Stat({ label, value, tone, }) {
    const toneClass = tone === "warning"
        ? "text-amber-300"
        : tone === "success"
            ? "text-[#00ff88]"
            : "text-[var(--z-fg)]";
    return (_jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] px-4 py-3", children: [_jsx("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: label }), _jsx("div", { className: `mt-1 text-xl font-semibold ${toneClass}`, children: value })] }));
}
export function LessonDetail({ surface }) {
    const { lesson, unit, level, program } = surface;
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("section", { className: "space-y-3", children: [_jsx("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: "Lesson" }), _jsx("h1", { className: "text-xl sm:text-2xl font-semibold text-[var(--z-fg)]", children: lesson.title }), _jsxs("div", { className: "flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--z-muted)]", children: [program ? _jsx("span", { children: program.name }) : null, level ? _jsxs("span", { children: ["\u00B7 ", level.name] }) : null, unit ? _jsxs("span", { children: ["\u00B7 ", unit.name] }) : null, lesson.difficulty ? (_jsxs("span", { className: "uppercase tracking-wider", children: ["\u00B7 ", lesson.difficulty] })) : null, typeof lesson.estimated_minutes === "number" ? (_jsxs("span", { children: ["\u00B7 ", lesson.estimated_minutes, "m"] })) : null] }), lesson.objective ? (_jsx("div", { className: "text-sm text-[var(--z-fg)]", children: lesson.objective })) : null, lesson.summary ? (_jsx("div", { className: "text-sm text-[var(--z-muted)]", children: lesson.summary })) : null] }), _jsxs("section", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: [_jsx(Stat, { label: "Materials", value: String(surface.kpis.totalMaterials) }), _jsx(Stat, { label: "Students started", value: String(surface.kpis.studentsStarted) }), _jsx(Stat, { label: "Completed", value: String(surface.kpis.studentsCompleted), tone: "success" }), _jsx(Stat, { label: "Needs review", value: String(surface.kpis.needsReview), tone: surface.kpis.needsReview > 0 ? "warning" : "default" })] }), _jsxs("section", { className: "space-y-2", children: [_jsx("h2", { className: "text-sm font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Materials" }), _jsx(MaterialList, { materials: surface.materials })] }), _jsxs("section", { className: "space-y-2", children: [_jsx("h2", { className: "text-sm font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Recent student progress" }), _jsx(StudentProgressList, { completions: surface.recentCompletions })] })] }));
}
