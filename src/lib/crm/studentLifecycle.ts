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

/**
 * Advance a student through the CRM lifecycle.
 * Legal transitions: lead → prospect → enrolled → inactive.
 * "inactive" can also be re-opened to any earlier stage.
 */
const LEGAL_NEXT: Record<StudentLifecycleStage, StudentLifecycleStage[]> = {
  lead: ["prospect", "enrolled", "inactive"],
  prospect: ["enrolled", "inactive", "lead"],
  enrolled: ["inactive", "prospect"],
  inactive: ["lead", "prospect", "enrolled"],
};

export function canTransition(
  from: StudentLifecycleStage,
  to: StudentLifecycleStage,
): boolean {
  return LEGAL_NEXT[from]?.includes(to) ?? false;
}

export async function setStudentStage(
  tenantId: string,
  studentId: string,
  nextStage: StudentLifecycleStage,
  opts?: { actorId?: string; reason?: string; category?: string },
): Promise<Student> {
  const current = await getStudentById(studentId, tenantId);
  if (!current) throw new Error(`Student ${studentId} not found`);
  const currentStage = ((current.status as StudentLifecycleStage | null) ??
    "lead") as StudentLifecycleStage;
  if (currentStage === nextStage) return current;
  if (!canTransition(currentStage, nextStage)) {
    throw new Error(
      `Illegal student transition ${currentStage} → ${nextStage}`,
    );
  }
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
