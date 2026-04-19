/**
 * Enrollment engine — orchestrates enrolling a student with a teacher,
 * updating their schedule linkage, and propagating status changes.
 *
 * Integrates with:
 *  - Scheduling OS (teacher assignment on `students.teacher_id`)
 *  - Billing OS (via `families` on the student's family_id; we do not
 *    mutate billing rows directly from here)
 *  - CRM student lifecycle (promotes to "enrolled")
 */
import {
  createEnrollment,
  endEnrollment as endEnrollmentRow,
  getEnrollmentById,
  listEnrollments,
  updateEnrollment as updateEnrollmentRow,
  type EnrollmentFilter,
} from "@data/enrollments";
import { getStudentById, updateStudent } from "@data/students";
import type { Enrollment, EnrollmentUpdate } from "@/lib/types/crm";

export type EnrollInput = {
  studentId: string;
  teacherId: string;
  startDate?: string;
  status?: string;
};

export async function enrollStudent(
  tenantId: string,
  input: EnrollInput,
): Promise<Enrollment> {
  const student = await getStudentById(input.studentId, tenantId);
  if (!student) throw new Error(`Student ${input.studentId} not found`);

  const enrollment = await createEnrollment(tenantId, {
    student_id: input.studentId,
    teacher_id: input.teacherId,
    start_date: input.startDate ?? new Date().toISOString().slice(0, 10),
    status: input.status ?? "active",
  });

  await updateStudent(input.studentId, tenantId, {
    teacher_id: input.teacherId,
    status: "enrolled",
    start_date: input.startDate ?? null,
    first_lesson_date: student.first_lesson_date ?? input.startDate ?? null,
  });

  return enrollment;
}

export async function updateEnrollment(
  tenantId: string,
  id: string,
  patch: EnrollmentUpdate,
): Promise<Enrollment> {
  return updateEnrollmentRow(id, tenantId, patch);
}

export async function endEnrollment(
  tenantId: string,
  id: string,
  endDate?: string,
): Promise<Enrollment> {
  const effective = endDate ?? new Date().toISOString().slice(0, 10);
  const ended = await endEnrollmentRow(id, tenantId, effective);
  const active = await listEnrollments(tenantId, {
    student_id: ended.student_id,
    status: "active",
  });
  if (active.length === 0) {
    await updateStudent(ended.student_id, tenantId, {
      status: "inactive",
      end_date: effective,
    });
  }
  return ended;
}

export async function listEnrollmentsFor(
  tenantId: string,
  filter?: EnrollmentFilter,
): Promise<Enrollment[]> {
  return listEnrollments(tenantId, filter);
}

export async function getEnrollment(
  tenantId: string,
  id: string,
): Promise<Enrollment | null> {
  return getEnrollmentById(id, tenantId);
}
