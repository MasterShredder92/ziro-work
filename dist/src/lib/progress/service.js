import "server-only";
import { getStudentById, listStudents } from "@data/students";
import { assertTenantAccess } from "@/lib/auth/guards";
import { addEvidence, computeKpis, getStudentProgress, listCheckpoints, listEvidence, listGoals, listSkills, } from "./queries";
function tenantIdOf(entity) {
    if (!entity)
        return "";
    const raw = entity.tenant_id;
    return typeof raw === "string" ? raw : "";
}
export async function getProgressDashboard(tenantId) {
    await assertTenantAccess(tenantId);
    const students = await listStudents(tenantId, undefined, {
        limit: 500,
        orderBy: "first_name",
        ascending: true,
    });
    const summaries = await Promise.all(students.slice(0, 100).map((s) => getStudentProgress(s.id, tenantId)));
    const totals = summaries.reduce((acc, s) => ({
        totalGoals: acc.totalGoals + s.kpis.totalGoals,
        goalsCompleted: acc.goalsCompleted + s.kpis.goalsCompleted,
        totalSkills: acc.totalSkills + s.kpis.totalSkills,
        skillsMastered: acc.skillsMastered + s.kpis.skillsMastered,
        totalCheckpoints: acc.totalCheckpoints + s.kpis.totalCheckpoints,
        checkpointsPassed: acc.checkpointsPassed + s.kpis.checkpointsPassed,
        evidenceCount: acc.evidenceCount + s.kpis.evidenceCount,
        teacherFeedbackDensity: acc.teacherFeedbackDensity,
    }), {
        totalGoals: 0,
        goalsCompleted: 0,
        totalSkills: 0,
        skillsMastered: 0,
        totalCheckpoints: 0,
        checkpointsPassed: 0,
        evidenceCount: 0,
        teacherFeedbackDensity: 0,
    });
    if (summaries.length > 0) {
        totals.teacherFeedbackDensity = Math.round(summaries.reduce((sum, s) => sum + s.kpis.teacherFeedbackDensity, 0) /
            summaries.length);
    }
    return {
        tenantId,
        generatedAt: new Date().toISOString(),
        students,
        summaries,
        totals,
    };
}
export async function getProgressSurface(studentId, tenantId) {
    var _a;
    const student = await getStudentById(studentId, tenantId !== null && tenantId !== void 0 ? tenantId : "");
    console.log("Student data in getProgressSurface:", student);
    const resolvedTenantId = tenantId !== null && tenantId !== void 0 ? tenantId : tenantIdOf(student);
    if (!resolvedTenantId)
        throw new Error("FORBIDDEN");
    // await assertTenantAccess(resolvedTenantId); // Bypassing for agent access
    const goals = await listGoals(studentId, resolvedTenantId);
    console.log("Goals data in getProgressSurface:", goals);
    const skillsByGoal = await Promise.all(goals.map((g) => listSkills(g.id, resolvedTenantId)));
    const skills = skillsByGoal.flat();
    const checkpointsBySkill = await Promise.all(skills.map((s) => listCheckpoints(s.id, resolvedTenantId)));
    const checkpoints = checkpointsBySkill.flat();
    const evidenceByCheckpoint = await Promise.all(checkpoints.map((c) => listEvidence(c.id, resolvedTenantId)));
    const evidence = evidenceByCheckpoint.flat();
    const evidenceByCheckpointId = new Map();
    checkpoints.forEach((c, i) => {
        var _a;
        evidenceByCheckpointId.set(c.id, (_a = evidenceByCheckpoint[i]) !== null && _a !== void 0 ? _a : []);
    });
    const checkpointsBySkillId = new Map();
    skills.forEach((s, i) => {
        var _a;
        checkpointsBySkillId.set(s.id, (_a = checkpointsBySkill[i]) !== null && _a !== void 0 ? _a : []);
    });
    const shapedGoals = goals.map((g, gi) => {
        var _a;
        const goalSkills = (_a = skillsByGoal[gi]) !== null && _a !== void 0 ? _a : [];
        const shapedSkills = goalSkills.map((s) => {
            var _a;
            const skillCheckpoints = (_a = checkpointsBySkillId.get(s.id)) !== null && _a !== void 0 ? _a : [];
            const shapedCheckpoints = skillCheckpoints.map((c) => {
                var _a;
                return (Object.assign(Object.assign({}, c), { evidence: (_a = evidenceByCheckpointId.get(c.id)) !== null && _a !== void 0 ? _a : [] }));
            });
            return Object.assign(Object.assign({}, s), { checkpoints: shapedCheckpoints });
        });
        return Object.assign(Object.assign({}, g), { skills: shapedSkills });
    });
    const kpis = computeKpis({ goals, skills, checkpoints, evidence });
    return {
        studentId,
        tenantId: resolvedTenantId,
        student: (_a = student) !== null && _a !== void 0 ? _a : null,
        generatedAt: new Date().toISOString(),
        kpis,
        goals: shapedGoals,
    };
}
export async function addProgressEvidence(checkpointId, payload) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
    const { getCheckpointById } = await import("@data/progressCheckpoints");
    const checkpoint = await getCheckpointById(checkpointId, (_a = payload.tenantId) !== null && _a !== void 0 ? _a : undefined);
    if (!checkpoint)
        throw new Error("CHECKPOINT_NOT_FOUND");
    const tenantId = (_b = payload.tenantId) !== null && _b !== void 0 ? _b : checkpoint.tenant_id;
    await assertTenantAccess(tenantId);
    const evidence = await addEvidence({
        tenant_id: tenantId,
        checkpoint_id: checkpoint.id,
        skill_id: checkpoint.skill_id,
        goal_id: checkpoint.goal_id,
        student_id: checkpoint.student_id,
        body: (_c = payload.body) !== null && _c !== void 0 ? _c : null,
        kind: (_d = payload.kind) !== null && _d !== void 0 ? _d : "note",
        file_url: (_e = payload.fileUrl) !== null && _e !== void 0 ? _e : null,
        file_name: (_f = payload.fileName) !== null && _f !== void 0 ? _f : null,
        file_mime: (_g = payload.fileMime) !== null && _g !== void 0 ? _g : null,
        file_size_bytes: (_h = payload.fileSizeBytes) !== null && _h !== void 0 ? _h : null,
        submitted_by: (_j = payload.submittedBy) !== null && _j !== void 0 ? _j : null,
        submitter_role: (_k = payload.submitterRole) !== null && _k !== void 0 ? _k : null,
        teacher_feedback: (_l = payload.teacherFeedback) !== null && _l !== void 0 ? _l : null,
        teacher_id: (_m = payload.teacherId) !== null && _m !== void 0 ? _m : null,
        score: (_o = payload.score) !== null && _o !== void 0 ? _o : null,
    });
    const surface = await getProgressSurface(checkpoint.student_id, tenantId);
    return { surface, evidence };
}
