import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { logAudit } from "@/lib/audit/log";
import { getCurriculumDashboard } from "@/lib/curriculum";
import { ProgramList } from "./components";
import { resolveCurriculumContext } from "./guard";
export const dynamic = "force-dynamic";
function Stat({ label, value }) {
    return (_jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] px-4 py-3", children: [_jsx("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: label }), _jsx("div", { className: "mt-1 text-xl font-semibold text-[var(--z-fg)]", children: value })] }));
}
export default async function CurriculumDashboardPage() {
    let ctx;
    try {
        ctx = await resolveCurriculumContext();
    }
    catch (_a) {
        return (_jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center", children: [_jsx("div", { className: "text-base font-semibold text-[var(--z-fg)]", children: "Forbidden" }), _jsx("div", { className: "mt-2 text-sm text-[var(--z-muted)]", children: "You do not have permission to view curriculum." })] }));
    }
    const data = await getCurriculumDashboard(ctx.tenantId);
    await logAudit("curriculum.dashboard.view", {
        tenantId: ctx.tenantId,
        profileId: ctx.session.userId,
        role: ctx.session.role,
        programs: data.kpis.totalPrograms,
        lessons: data.kpis.totalLessons,
        source: "page",
    });
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("section", { id: "overview", className: "space-y-3 scroll-mt-24", children: [_jsxs("header", { children: [_jsx("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: "Curriculum OS" }), _jsx("h1", { className: "text-xl sm:text-2xl font-semibold text-[var(--z-fg)]", children: "Programs & Lessons" }), _jsxs("div", { className: "text-xs text-[var(--z-muted)]", children: ["Updated ", new Date(data.generatedAt).toLocaleTimeString()] })] }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3", children: [_jsx(Stat, { label: "Programs", value: String(data.kpis.totalPrograms) }), _jsx(Stat, { label: "Active", value: String(data.kpis.activePrograms) }), _jsx(Stat, { label: "Levels", value: String(data.kpis.totalLevels) }), _jsx(Stat, { label: "Units", value: String(data.kpis.totalUnits) }), _jsx(Stat, { label: "Lessons", value: String(data.kpis.totalLessons) }), _jsx(Stat, { label: "Materials", value: String(data.kpis.totalMaterials) })] })] }), _jsxs("section", { id: "programs", className: "space-y-3 scroll-mt-24", children: [_jsx("h2", { className: "text-sm font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Programs" }), _jsx(ProgramList, { programs: data.tree.programs.map((p) => p.program) })] })] }));
}
