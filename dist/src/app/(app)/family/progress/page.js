import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { ensureFamilyAccess } from "../guard";
import { getFamilyStudents, resolveCurrentFamilyId, } from "@/lib/portal/queries";
import { getProgressSurface } from "@/lib/progress/service";
import { logAudit } from "@/lib/audit/log";
import { CheckpointList, EvidenceList, GoalList, ProgressSummary, SkillList, } from "../../progress/components";
export const dynamic = "force-dynamic";
function displayName(student) {
    if (!student || typeof student !== "object")
        return "Student";
    const row = student;
    const first = typeof row.first_name === "string" ? row.first_name : "";
    const last = typeof row.last_name === "string" ? row.last_name : "";
    const full = `${first} ${last}`.trim();
    return full.length > 0 ? full : "Student";
}
export default async function FamilyProgressPage() {
    const session = await ensureFamilyAccess();
    const familyId = await resolveCurrentFamilyId();
    if (!familyId) {
        return (_jsx("div", { className: "rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-6 text-sm text-[var(--z-muted)]", children: "No family record linked to your account yet." }));
    }
    const students = await getFamilyStudents(familyId);
    const surfaces = await Promise.all(students.map((s) => {
        var _a;
        return getProgressSurface(s.id, (_a = s.tenant_id) !== null && _a !== void 0 ? _a : session.tenantId);
    }));
    await logAudit("progress.family.view", {
        tenantId: session.tenantId,
        profileId: session.userId,
        role: session.role,
        familyId,
        students: students.length,
        source: "family_portal",
    });
    if (students.length === 0) {
        return (_jsx("div", { className: "rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-6 text-sm text-[var(--z-muted)]", children: "No students linked to your family yet." }));
    }
    return (_jsxs("div", { className: "mx-auto flex w-full max-w-5xl flex-col gap-8", children: [_jsxs("header", { children: [_jsx("h1", { className: "text-xl font-semibold text-[var(--z-fg)]", children: "Student progress" }), _jsx("p", { className: "text-sm text-[var(--z-muted)]", children: "Your students' goals, skills, and teacher feedback." })] }), surfaces.map((surface, i) => {
                const student = students[i];
                return (_jsxs("section", { className: "space-y-4", children: [_jsx("header", { className: "flex items-baseline justify-between", children: _jsx("h2", { className: "text-lg font-semibold text-[var(--z-fg)]", children: displayName(student) }) }), _jsx(ProgressSummary, { kpis: surface.kpis, title: "Snapshot" }), surface.goals.length === 0 ? (_jsx("div", { className: "rounded-lg border border-dashed border-[var(--z-border)] p-6 text-sm text-[var(--z-muted)] text-center", children: "No goals have been set yet." })) : (_jsxs(_Fragment, { children: [_jsx(GoalList, { goals: surface.goals, title: "Goals" }), surface.goals.map((goal) => (_jsxs("article", { className: "rounded-lg border border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface),black_4%)] p-4 space-y-3", children: [_jsxs("header", { children: [_jsxs("div", { className: "text-[10px] font-semibold uppercase tracking-wider text-[#00ff88]", children: ["Goal \u00B7 ", goal.status] }), _jsx("h3", { className: "mt-0.5 text-base font-semibold text-[var(--z-fg)]", children: goal.title })] }), _jsx(SkillList, { skills: goal.skills, title: "Skills" }), goal.skills.map((skill) => (_jsxs("div", { className: "space-y-3", children: [_jsx("div", { className: "text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: skill.title }), _jsx(CheckpointList, { checkpoints: skill.checkpoints, title: "Checkpoints" }), skill.checkpoints.map((checkpoint) => (_jsx(EvidenceList, { evidence: checkpoint.evidence, title: `Evidence · ${checkpoint.title}` }, checkpoint.id)))] }, skill.id)))] }, goal.id)))] }))] }, surface.studentId));
            })] }));
}
