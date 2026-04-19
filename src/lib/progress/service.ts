import "server-only";
import { getStudentById, listStudents } from "@data/students";
import { assertTenantAccess } from "@/lib/auth/guards";
import type { Student } from "@/lib/types/entities";
import {
  addEvidence,
  computeKpis,
  getStudentProgress,
  listCheckpoints,
  listEvidence,
  listGoals,
  listSkills,
} from "./queries";
import type {
  ProgressCheckpoint,
  ProgressDashboardData,
  ProgressEvidence,
  ProgressKpis,
  ProgressSurface,
  ProgressSurfaceCheckpoint,
  ProgressSurfaceSkill,
  StudentProgressSummary,
} from "./types";

type ProgressCheckpointLike = ProgressCheckpoint;
import type { UpsertEvidenceInput } from "@data/progressEvidence";

function tenantIdOf(entity: { tenant_id?: string | null } | null | undefined): string {
  if (!entity) return "";
  const raw = (entity as { tenant_id?: string | null }).tenant_id;
  return typeof raw === "string" ? raw : "";
}

export async function getProgressDashboard(
  tenantId: string,
): Promise<ProgressDashboardData> {
  await assertTenantAccess(tenantId);

  const students = await listStudents(tenantId, undefined, {
    limit: 500,
    orderBy: "first_name",
    ascending: true,
  });

  const summaries: StudentProgressSummary[] = await Promise.all(
    students.slice(0, 100).map((s) => getStudentProgress(s.id, tenantId)),
  );

  const totals: ProgressKpis = summaries.reduce<ProgressKpis>(
    (acc, s) => ({
      totalGoals: acc.totalGoals + s.kpis.totalGoals,
      goalsCompleted: acc.goalsCompleted + s.kpis.goalsCompleted,
      totalSkills: acc.totalSkills + s.kpis.totalSkills,
      skillsMastered: acc.skillsMastered + s.kpis.skillsMastered,
      totalCheckpoints: acc.totalCheckpoints + s.kpis.totalCheckpoints,
      checkpointsPassed: acc.checkpointsPassed + s.kpis.checkpointsPassed,
      evidenceCount: acc.evidenceCount + s.kpis.evidenceCount,
      teacherFeedbackDensity: acc.teacherFeedbackDensity,
    }),
    {
      totalGoals: 0,
      goalsCompleted: 0,
      totalSkills: 0,
      skillsMastered: 0,
      totalCheckpoints: 0,
      checkpointsPassed: 0,
      evidenceCount: 0,
      teacherFeedbackDensity: 0,
    },
  );

  if (summaries.length > 0) {
    totals.teacherFeedbackDensity = Math.round(
      summaries.reduce((sum, s) => sum + s.kpis.teacherFeedbackDensity, 0) /
        summaries.length,
    );
  }

  return {
    tenantId,
    generatedAt: new Date().toISOString(),
    students,
    summaries,
    totals,
  };
}

export async function getProgressSurface(
  studentId: string,
  tenantId?: string,
): Promise<ProgressSurface> {
  const student = await getStudentById(studentId, tenantId ?? "");
  const resolvedTenantId = tenantId ?? tenantIdOf(student);
  if (!resolvedTenantId) throw new Error("FORBIDDEN");
  await assertTenantAccess(resolvedTenantId);

  const goals = await listGoals(studentId, resolvedTenantId);
  const skillsByGoal = await Promise.all(
    goals.map((g) => listSkills(g.id, resolvedTenantId)),
  );

  const skills = skillsByGoal.flat();
  const checkpointsBySkill = await Promise.all(
    skills.map((s) => listCheckpoints(s.id, resolvedTenantId)),
  );
  const checkpoints = checkpointsBySkill.flat();

  const evidenceByCheckpoint = await Promise.all(
    checkpoints.map((c) => listEvidence(c.id, resolvedTenantId)),
  );
  const evidence = evidenceByCheckpoint.flat();

  const evidenceByCheckpointId = new Map<string, ProgressEvidence[]>();
  checkpoints.forEach((c, i) => {
    evidenceByCheckpointId.set(c.id, evidenceByCheckpoint[i] ?? []);
  });

  const checkpointsBySkillId = new Map<string, ProgressCheckpointLike[]>();
  skills.forEach((s, i) => {
    checkpointsBySkillId.set(s.id, checkpointsBySkill[i] ?? []);
  });

  const shapedGoals = goals.map((g, gi) => {
    const goalSkills = skillsByGoal[gi] ?? [];
    const shapedSkills: ProgressSurfaceSkill[] = goalSkills.map((s) => {
      const skillCheckpoints = checkpointsBySkillId.get(s.id) ?? [];
      const shapedCheckpoints: ProgressSurfaceCheckpoint[] = skillCheckpoints.map(
        (c) => ({
          ...c,
          evidence: evidenceByCheckpointId.get(c.id) ?? [],
        }),
      );
      return {
        ...s,
        checkpoints: shapedCheckpoints,
      };
    });
    return { ...g, skills: shapedSkills };
  });

  const kpis = computeKpis({ goals, skills, checkpoints, evidence });

  return {
    studentId,
    tenantId: resolvedTenantId,
    student: (student as Student | null) ?? null,
    generatedAt: new Date().toISOString(),
    kpis,
    goals: shapedGoals,
  };
}

export type AddEvidencePayload = {
  tenantId?: string;
  body?: string | null;
  kind?: UpsertEvidenceInput["kind"];
  fileUrl?: string | null;
  fileName?: string | null;
  fileMime?: string | null;
  fileSizeBytes?: number | null;
  submittedBy?: string | null;
  submitterRole?: string | null;
  teacherId?: string | null;
  teacherFeedback?: string | null;
  score?: number | null;
};

export async function addProgressEvidence(
  checkpointId: string,
  payload: AddEvidencePayload,
): Promise<{ surface: ProgressSurface; evidence: Awaited<ReturnType<typeof addEvidence>> }> {
  const { getCheckpointById } = await import("@data/progressCheckpoints");
  const checkpoint = await getCheckpointById(
    checkpointId,
    payload.tenantId ?? undefined,
  );
  if (!checkpoint) throw new Error("CHECKPOINT_NOT_FOUND");

  const tenantId = payload.tenantId ?? checkpoint.tenant_id;
  await assertTenantAccess(tenantId);

  const evidence = await addEvidence({
    tenant_id: tenantId,
    checkpoint_id: checkpoint.id,
    skill_id: checkpoint.skill_id,
    goal_id: checkpoint.goal_id,
    student_id: checkpoint.student_id,
    body: payload.body ?? null,
    kind: payload.kind ?? "note",
    file_url: payload.fileUrl ?? null,
    file_name: payload.fileName ?? null,
    file_mime: payload.fileMime ?? null,
    file_size_bytes: payload.fileSizeBytes ?? null,
    submitted_by: payload.submittedBy ?? null,
    submitter_role: payload.submitterRole ?? null,
    teacher_feedback: payload.teacherFeedback ?? null,
    teacher_id: payload.teacherId ?? null,
    score: payload.score ?? null,
  });

  const surface = await getProgressSurface(checkpoint.student_id, tenantId);
  return { surface, evidence };
}
