import { listPrograms as listProgramsData, getProgram as getProgramData } from "@data/programs";
import { listLevels as listLevelsData } from "@data/levels";
import { listUnits as listUnitsData } from "@data/units";
import { listLessons as listLessonsData } from "@data/lessons";
import { listMaterials as listMaterialsData } from "@data/materials";
import { listStudentProgress as listStudentProgressData } from "@data/studentProgress";
import type {
  Lesson,
  LessonCompletion,
  Level,
  Material,
  Program,
  StudentProgress,
  StudentProgressSummary,
  Unit,
} from "./types";

export async function listPrograms(tenantId: string): Promise<Program[]> {
  return listProgramsData(tenantId);
}

export async function getProgram(
  programId: string,
  tenantId?: string,
): Promise<Program | null> {
  return getProgramData(programId, tenantId);
}

export async function listLevels(
  programId: string,
  tenantId?: string,
): Promise<Level[]> {
  return listLevelsData(programId, tenantId);
}

export async function listUnits(
  levelId: string,
  tenantId?: string,
): Promise<Unit[]> {
  return listUnitsData(levelId, tenantId);
}

export async function listLessons(
  unitId: string,
  tenantId?: string,
): Promise<Lesson[]> {
  return listLessonsData(unitId, tenantId);
}

export async function listMaterials(
  lessonId: string,
  tenantId?: string,
): Promise<Material[]> {
  return listMaterialsData(lessonId, tenantId);
}

export async function getStudentProgress(
  studentId: string,
  tenantId?: string,
): Promise<StudentProgress> {
  const entries = await listStudentProgressData(
    { student_id: studentId },
    tenantId,
  );

  const byProgram = new Map<string | null, LessonCompletion[]>();
  for (const entry of entries) {
    const key = entry.program_id ?? null;
    const arr = byProgram.get(key) ?? [];
    arr.push(entry);
    byProgram.set(key, arr);
  }

  const summaries: StudentProgressSummary[] = [];
  for (const [programId, group] of byProgram.entries()) {
    const total = group.length;
    const started = group.filter((g) => g.status === "in_progress").length;
    const completed = group.filter((g) => g.status === "completed").length;
    const needsReview = group.filter((g) => g.status === "needs_review").length;
    const lastActivityAt = group
      .map((g) => g.updated_at)
      .sort()
      .pop() ?? null;
    summaries.push({
      studentId,
      programId,
      lessonsStarted: started,
      lessonsCompleted: completed,
      lessonsNeedingReview: needsReview,
      totalLessons: total,
      completionPct: total === 0 ? 0 : Math.round((completed / total) * 100),
      lastActivityAt,
    });
  }

  return {
    studentId,
    tenantId: tenantId ?? "",
    entries,
    summaries,
    generatedAt: new Date().toISOString(),
  };
}
