import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { logAudit } from "@/lib/audit/log";
import { getProgressDashboard } from "@/lib/progress/service";
import { resolveProgressContext } from "./guard";
import { ProgressSummary, StudentSelector, } from "./components";
export const dynamic = "force-dynamic";
export default async function ProgressDashboardPage({ searchParams, }) {
    var _a;
    let ctx;
    try {
        ctx = await resolveProgressContext();
    }
    catch (_b) {
        return (_jsx("div", { className: "rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-6 text-sm text-[var(--z-muted)]", children: "You don't have access to the Progress OS. Please contact your administrator." }));
    }
    const resolved = (_a = (await searchParams)) !== null && _a !== void 0 ? _a : {};
    const studentId = typeof resolved.studentId === "string" ? resolved.studentId : null;
    const data = await getProgressDashboard(ctx.tenantId);
    await logAudit("progress.dashboard.view", {
        tenantId: ctx.tenantId,
        profileId: ctx.session.userId,
        role: ctx.session.role,
        students: data.students.length,
        totalGoals: data.totals.totalGoals,
        totalSkills: data.totals.totalSkills,
        source: "page",
    });
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("section", { id: "overview", className: "space-y-3", children: [_jsxs("header", { className: "flex flex-col gap-1", children: [_jsx("h1", { className: "text-xl font-semibold text-[var(--z-fg)]", children: "Student Progress" }), _jsx("p", { className: "text-sm text-[var(--z-muted)]", children: "Track goals, skills, checkpoints, and evidence across your roster." })] }), _jsx(ProgressSummary, { kpis: data.totals, title: "Workspace totals" })] }), _jsx("section", { id: "students", className: "scroll-mt-20", children: _jsx(StudentSelector, { students: data.students, summaries: data.summaries, selectedStudentId: studentId }) })] }));
}
