import {
  getStudentById,
  updateStudent,
  createStudent,
  deactivateStudent,
} from "@data/students";
import type {
  Student,
  StudentInsert,
  StudentLifecycleStage,
} from "@/lib/types/crm";

// Transition enforcement lives in the DB trigger
// enforce_student_stage_transitions (Phase 3 migration).
// Invalid transitions surface as Postgres check_violation errors
// with SQLSTATE 23514 and a human-readable message prefixed
// "student_stage_invalid:".

export async function setStudentStage(
  tenantId: string,
  studentId: string,
  nextStage: StudentLifecycleStage,
  opts?: { actorId?: string; reason?: string; category?: string },
): Promise<Student> {
  const current = await getStudentById(studentId, tenantId);
  if (!current) throw new Error(`Student ${studentId} not found`);
  if ((current.status as string) === nextStage) return current;
  if (nextStage === "inactive") {
    return deactivateStudent(
      studentId,
      tenantId,
      opts?.actorId ?? "system",
      opts?.reason,
      opts?.category,
    );
  }
  return updateStudent(studentId, tenantId, {
    status: nextStage,
    deactivated_at: null,
    deactivated_by: null,
  });
}

export async function createProspect(
  tenantId: string,
  input: Omit<StudentInsert, "tenant_id" | "status">,
): Promise<Student> {
  return createStudent(tenantId, { ...input, status: "trial" });
}

export async function enrollStudentAsActive(
  tenantId: string,
  studentId: string,
  firstLessonDate?: string,
): Promise<Student> {
  return updateStudent(studentId, tenantId, {
    status: "active",
    first_lesson_date: firstLessonDate ?? null,
    start_date: firstLessonDate ?? null,
  });
}
