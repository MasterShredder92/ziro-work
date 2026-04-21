import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { logAudit } from "@/lib/audit/log";
import { getProgressSurface } from "@/lib/progress/service";
import { resolveStudentContext } from "../guard";
import { CheckpointList, EvidenceList, GoalList, ProgressSummary, SkillList, } from "../../progress/components";
export const dynamic = "force-dynamic";
export default async function StudentProgressPage() {
    let ctx;
    try {
        ctx = await resolveStudentContext();
    }
    catch (_a) {
        return (_jsx("div", { className: "rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-6 text-sm text-[var(--z-muted)]", children: "Your progress isn't available right now. Please contact your administrator." }));
    }
    const surface = await getProgressSurface(ctx.studentId, ctx.tenantId);
    await logAudit("progress.surface.view", {
        tenantId: ctx.tenantId,
        profileId: ctx.session.userId,
        role: ctx.session.role,
        studentId: ctx.studentId,
        source: "student_portal",
    });
    return (_jsxs("div", { className: "mx-auto flex w-full max-w-4xl flex-col gap-6", children: [_jsxs("header", { children: [_jsx("h1", { className: "text-xl font-semibold text-[var(--z-fg)]", children: "My progress" }), _jsx("p", { className: "text-sm text-[var(--z-muted)]", children: "Track your goals, skills, and teacher feedback over time." })] }), _jsx(ProgressSummary, { kpis: surface.kpis, title: "Snapshot" }), surface.goals.length === 0 ? (_jsx("div", { className: "rounded-lg border border-dashed border-[var(--z-border)] p-6 text-sm text-[var(--z-muted)] text-center", children: "No goals have been set for you yet. Check back soon!" })) : null, _jsx("div", { className: "space-y-6", children: surface.goals.map((goal) => (_jsxs("article", { className: "rounded-lg border border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface),black_4%)] p-4 space-y-4", children: [_jsxs("header", { children: [_jsxs("div", { className: "text-[10px] font-semibold uppercase tracking-wider text-[#00ff88]", children: ["Goal \u00B7 ", goal.status] }), _jsx("h2", { className: "mt-0.5 text-lg font-semibold text-[var(--z-fg)]", children: goal.title }), goal.description ? (_jsx("p", { className: "text-sm text-[var(--z-muted)]", children: goal.description })) : null] }), _jsx(SkillList, { skills: goal.skills, title: "Skills" }), goal.skills.map((skill) => (_jsxs("div", { className: "space-y-3", children: [_jsx("div", { className: "text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: skill.title }), _jsx(CheckpointList, { checkpoints: skill.checkpoints, title: "Checkpoints" }), skill.checkpoints.map((checkpoint) => (_jsx(EvidenceList, { evidence: checkpoint.evidence, title: `Evidence · ${checkpoint.title}` }, checkpoint.id)))] }, skill.id)))] }, goal.id))) }), surface.goals.length > 0 ? (_jsx(GoalList, { goals: surface.goals, title: "All goals" })) : null] }));
}
