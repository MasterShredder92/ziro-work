import "server-only";
import { listCheckpoints as listCheckpointsRaw, upsertCheckpoint as upsertCheckpointRaw, } from "@data/progressCheckpoints";
import { listEvidence as listEvidenceRaw, upsertEvidence as upsertEvidenceRaw, } from "@data/progressEvidence";
import { listGoals as listGoalsRaw, upsertGoal as upsertGoalRaw, } from "@data/progressGoals";
import { listSkills as listSkillsRaw, upsertSkill as upsertSkillRaw, } from "@data/progressSkills";
export async function listGoals(studentId, tenantId) {
    const rows = await listGoalsRaw({ student_id: studentId }, tenantId);
    return rows;
}
export async function listSkills(goalId, tenantId) {
    const rows = await listSkillsRaw({ goal_id: goalId }, tenantId);
    return rows;
}
export async function listCheckpoints(skillId, tenantId) {
    const rows = await listCheckpointsRaw({ skill_id: skillId }, tenantId);
    return rows;
}
export async function listEvidence(checkpointId, tenantId) {
    const rows = await listEvidenceRaw({ checkpoint_id: checkpointId }, tenantId);
    return rows;
}
export async function listEvidenceForStudent(studentId, tenantId) {
    const rows = await listEvidenceRaw({ student_id: studentId }, tenantId);
    return rows;
}
export function computeKpis(input) {
    const goalsCompleted = input.goals.filter((g) => g.status === "completed")
        .length;
    const skillsMastered = input.skills.filter((s) => s.status === "mastered")
        .length;
    const checkpointsPassed = input.checkpoints.filter((c) => c.status === "passed").length;
    const checkpointsWithFeedback = input.checkpoints.filter((c) => { var _a; return ((_a = c.teacher_feedback) !== null && _a !== void 0 ? _a : "").trim().length > 0; }).length;
    const evidenceWithFeedback = input.evidence.filter((e) => { var _a; return ((_a = e.teacher_feedback) !== null && _a !== void 0 ? _a : "").trim().length > 0; }).length;
    const feedbackDenominator = input.checkpoints.length + input.evidence.length || 1;
    const teacherFeedbackDensity = Math.round(((checkpointsWithFeedback + evidenceWithFeedback) / feedbackDenominator) *
        100);
    return {
        totalGoals: input.goals.length,
        goalsCompleted,
        totalSkills: input.skills.length,
        skillsMastered,
        totalCheckpoints: input.checkpoints.length,
        checkpointsPassed,
        evidenceCount: input.evidence.length,
        teacherFeedbackDensity,
    };
}
export async function getStudentProgress(studentId, tenantId) {
    const goals = await listGoals(studentId, tenantId);
    const [skillsNested, checkpointsNested, evidence] = await Promise.all([
        Promise.all(goals.map((g) => listSkills(g.id, tenantId))),
        (async () => {
            const rows = await listCheckpointsRaw({ student_id: studentId }, tenantId);
            return rows;
        })(),
        listEvidenceForStudent(studentId, tenantId),
    ]);
    const skills = skillsNested.flat();
    const kpis = computeKpis({
        goals,
        skills,
        checkpoints: checkpointsNested,
        evidence,
    });
    return {
        studentId,
        tenantId: tenantId !== null && tenantId !== void 0 ? tenantId : "",
        generatedAt: new Date().toISOString(),
        kpis,
        goals,
        skills,
        checkpoints: checkpointsNested,
        evidence,
    };
}
export async function createGoal(input) {
    const row = await upsertGoalRaw(input);
    return row;
}
export async function createSkill(input) {
    const row = await upsertSkillRaw(input);
    return row;
}
export async function createCheckpoint(input) {
    const row = await upsertCheckpointRaw(input);
    return row;
}
export async function addEvidence(input) {
    const row = await upsertEvidenceRaw(input);
    return row;
}
