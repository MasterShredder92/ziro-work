import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { notFound } from "next/navigation";
import Link from "next/link";
import { logAudit } from "@/lib/audit/log";
import { getProgressSurface } from "@/lib/progress/service";
import { resolveProgressContext } from "../guard";
import { CheckpointList, EvidenceList, EvidenceUploader, GoalList, ProgressSummary, SkillList, } from "../components";
export const dynamic = "force-dynamic";
function resolveStudentName(student) {
    var _a, _b;
    if (!student)
        return "Student";
    const first = (_a = student.first_name) !== null && _a !== void 0 ? _a : "";
    const last = (_b = student.last_name) !== null && _b !== void 0 ? _b : "";
    const full = `${first} ${last}`.trim();
    return full.length > 0 ? full : "Student";
}
export default async function ProgressSurfacePage({ params, searchParams, }) {
    var _a;
    const { studentId } = await params;
    await searchParams;
    if (!studentId || typeof studentId !== "string") {
        notFound();
    }
    let ctx;
    try {
        ctx = await resolveProgressContext();
    }
    catch (_b) {
        return (_jsx("div", { className: "rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-6 text-sm text-[var(--z-muted)]", children: "You don't have access to view student progress. Please contact your administrator." }));
    }
    let surface;
    try {
        surface = await getProgressSurface(studentId, ctx.tenantId);
    }
    catch (_c) {
        return (_jsx("div", { className: "rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-6 text-sm text-[var(--z-muted)]", children: "Unable to load progress for this student." }));
    }
    const canWrite = ctx.session.role === "teacher" ||
        ctx.session.role === "director" ||
        ctx.session.role === "admin";
    await logAudit("progress.surface.view", {
        tenantId: ctx.tenantId,
        profileId: ctx.session.userId,
        role: ctx.session.role,
        studentId,
        source: "progress_os",
    });
    const studentName = resolveStudentName((_a = surface.student) !== null && _a !== void 0 ? _a : null);
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("header", { className: "flex flex-col gap-2", children: [_jsxs("div", { className: "text-xs text-[var(--z-muted)]", children: [_jsx(Link, { href: "/progress", className: "hover:underline", children: "All students" }), _jsx("span", { className: "mx-1.5", children: "/" }), _jsx("span", { children: studentName })] }), _jsxs("h1", { className: "text-xl font-semibold text-[var(--z-fg)]", children: [studentName, " \u00B7 Progress"] }), _jsx("p", { className: "text-sm text-[var(--z-muted)]", children: "Goals, skills, checkpoints, and evidence for this student." })] }), _jsx(ProgressSummary, { kpis: surface.kpis, title: "Snapshot" }), surface.goals.length === 0 ? (_jsx("div", { className: "rounded-lg border border-dashed border-[var(--z-border)] p-6 text-sm text-[var(--z-muted)] text-center", children: "No goals have been set for this student yet." })) : (_jsx(GoalList, { goals: surface.goals, title: "Goals" })), _jsx("div", { className: "space-y-8", children: surface.goals.map((goal) => (_jsxs("article", { className: "rounded-lg border border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface),black_4%)] p-4 space-y-4", children: [_jsxs("header", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { className: "min-w-0", children: [_jsxs("div", { className: "text-[10px] font-semibold uppercase tracking-wider text-[#00ff88]", children: ["Goal \u00B7 ", goal.status] }), _jsx("h2", { className: "mt-0.5 text-lg font-semibold text-[var(--z-fg)]", children: goal.title }), goal.description ? (_jsx("p", { className: "mt-1 text-sm text-[var(--z-muted)]", children: goal.description })) : null] }), goal.target_date ? (_jsxs("div", { className: "text-[11px] text-[var(--z-muted)] whitespace-nowrap", children: ["Target ", new Date(goal.target_date).toLocaleDateString()] })) : null] }), _jsx(SkillList, { skills: goal.skills, title: "Skills" }), _jsx("div", { className: "space-y-6", children: goal.skills.map((skill) => (_jsxs("section", { className: "rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-4 space-y-3", children: [_jsxs("header", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { children: [_jsxs("div", { className: "text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: ["Skill \u00B7 ", skill.status] }), _jsx("h3", { className: "mt-0.5 text-base font-semibold text-[var(--z-fg)]", children: skill.title }), skill.rubric ? (_jsx("p", { className: "mt-1 text-xs text-[var(--z-muted)]", children: skill.rubric })) : null] }), typeof skill.mastery_score === "number" ? (_jsxs("div", { className: "text-[11px] text-[var(--z-muted)] whitespace-nowrap", children: ["Mastery ", skill.mastery_score] })) : null] }), _jsx(CheckpointList, { checkpoints: skill.checkpoints, title: "Checkpoints" }), _jsx("div", { className: "space-y-4", children: skill.checkpoints.map((checkpoint) => (_jsxs("div", { className: "rounded-lg border border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface),black_4%)] p-3 space-y-3", children: [_jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { className: "min-w-0", children: [_jsxs("div", { className: "text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: ["Checkpoint \u00B7 ", checkpoint.status] }), _jsx("div", { className: "mt-0.5 text-sm font-medium text-[var(--z-fg)]", children: checkpoint.title }), checkpoint.teacher_feedback ? (_jsxs("p", { className: "mt-1 text-xs text-[var(--z-muted)]", children: ["Teacher feedback: ", checkpoint.teacher_feedback] })) : null] }), typeof checkpoint.score === "number" ? (_jsxs("div", { className: "text-[11px] text-[var(--z-muted)] whitespace-nowrap", children: ["Score ", checkpoint.score] })) : null] }), _jsx(EvidenceList, { evidence: checkpoint.evidence, title: `Evidence · ${checkpoint.title}` }), canWrite ? (_jsx(EvidenceUploader, { checkpointId: checkpoint.id, studentId: studentId, tenantId: ctx.tenantId })) : null] }, checkpoint.id))) })] }, skill.id))) })] }, goal.id))) })] }));
}
