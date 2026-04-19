import "server-only";
import {
  listCheckpoints as listCheckpointsRaw,
  upsertCheckpoint as upsertCheckpointRaw,
  type ProgressCheckpointRow,
  type UpsertCheckpointInput,
} from "@data/progressCheckpoints";
import {
  listEvidence as listEvidenceRaw,
  upsertEvidence as upsertEvidenceRaw,
  type ProgressEvidenceRow,
  type UpsertEvidenceInput,
} from "@data/progressEvidence";
import {
  listGoals as listGoalsRaw,
  upsertGoal as upsertGoalRaw,
  type ProgressGoalRow,
  type UpsertGoalInput,
} from "@data/progressGoals";
import {
  listSkills as listSkillsRaw,
  upsertSkill as upsertSkillRaw,
  type ProgressSkillRow,
  type UpsertSkillInput,
} from "@data/progressSkills";

import type {
  ProgressCheckpoint,
  ProgressEvidence,
  ProgressGoal,
  ProgressKpis,
  ProgressSkill,
  StudentProgressSummary,
} from "./types";

export async function listGoals(
  studentId: string,
  tenantId?: string,
): Promise<ProgressGoal[]> {
  const rows = await listGoalsRaw({ student_id: studentId }, tenantId);
  return rows as ProgressGoalRow[] as ProgressGoal[];
}

export async function listSkills(
  goalId: string,
  tenantId?: string,
): Promise<ProgressSkill[]> {
  const rows = await listSkillsRaw({ goal_id: goalId }, tenantId);
  return rows as ProgressSkillRow[] as ProgressSkill[];
}

export async function listCheckpoints(
  skillId: string,
  tenantId?: string,
): Promise<ProgressCheckpoint[]> {
  const rows = await listCheckpointsRaw({ skill_id: skillId }, tenantId);
  return rows as ProgressCheckpointRow[] as ProgressCheckpoint[];
}

export async function listEvidence(
  checkpointId: string,
  tenantId?: string,
): Promise<ProgressEvidence[]> {
  const rows = await listEvidenceRaw(
    { checkpoint_id: checkpointId },
    tenantId,
  );
  return rows as ProgressEvidenceRow[] as ProgressEvidence[];
}

export async function listEvidenceForStudent(
  studentId: string,
  tenantId?: string,
): Promise<ProgressEvidence[]> {
  const rows = await listEvidenceRaw({ student_id: studentId }, tenantId);
  return rows as ProgressEvidenceRow[] as ProgressEvidence[];
}

export function computeKpis(input: {
  goals: ProgressGoal[];
  skills: ProgressSkill[];
  checkpoints: ProgressCheckpoint[];
  evidence: ProgressEvidence[];
}): ProgressKpis {
  const goalsCompleted = input.goals.filter((g) => g.status === "completed")
    .length;
  const skillsMastered = input.skills.filter((s) => s.status === "mastered")
    .length;
  const checkpointsPassed = input.checkpoints.filter(
    (c) => c.status === "passed",
  ).length;

  const checkpointsWithFeedback = input.checkpoints.filter(
    (c) => (c.teacher_feedback ?? "").trim().length > 0,
  ).length;
  const evidenceWithFeedback = input.evidence.filter(
    (e) => (e.teacher_feedback ?? "").trim().length > 0,
  ).length;

  const feedbackDenominator =
    input.checkpoints.length + input.evidence.length || 1;
  const teacherFeedbackDensity = Math.round(
    ((checkpointsWithFeedback + evidenceWithFeedback) / feedbackDenominator) *
      100,
  );

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

export async function getStudentProgress(
  studentId: string,
  tenantId?: string,
): Promise<StudentProgressSummary> {
  const goals = await listGoals(studentId, tenantId);

  const [skillsNested, checkpointsNested, evidence] = await Promise.all([
    Promise.all(goals.map((g) => listSkills(g.id, tenantId))),
    (async () => {
      const rows = await listCheckpointsRaw(
        { student_id: studentId },
        tenantId,
      );
      return rows as ProgressCheckpointRow[] as ProgressCheckpoint[];
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
    tenantId: tenantId ?? "",
    generatedAt: new Date().toISOString(),
    kpis,
    goals,
    skills,
    checkpoints: checkpointsNested,
    evidence,
  };
}

export async function createGoal(input: UpsertGoalInput): Promise<ProgressGoal> {
  const row = await upsertGoalRaw(input);
  return row as ProgressGoalRow as ProgressGoal;
}

export async function createSkill(
  input: UpsertSkillInput,
): Promise<ProgressSkill> {
  const row = await upsertSkillRaw(input);
  return row as ProgressSkillRow as ProgressSkill;
}

export async function createCheckpoint(
  input: UpsertCheckpointInput,
): Promise<ProgressCheckpoint> {
  const row = await upsertCheckpointRaw(input);
  return row as ProgressCheckpointRow as ProgressCheckpoint;
}

export async function addEvidence(
  input: UpsertEvidenceInput,
): Promise<ProgressEvidence> {
  const row = await upsertEvidenceRaw(input);
  return row as ProgressEvidenceRow as ProgressEvidence;
}
