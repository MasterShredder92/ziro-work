/**
 * Enrollment engine — orchestrates enrolling a student with a teacher,
 * updating their schedule linkage, and propagating status changes.
 *
 * enrollStudent delegates to the enroll_student Postgres RPC (Phase 3)
 * for atomic, single-transaction execution. All other functions remain
 * as thin data-layer wrappers.
 */
import {
  endEnrollment as endEnrollmentRow,
  getEnrollmentById,
  listEnrollments,
  updateEnrollment as updateEnrollmentRow,
  type EnrollmentFilter,
} from "@data/enrollments";
import { getStudentById, updateStudent } from "@data/students";
import { getServiceClient } from "@/lib/supabase";
import { assertServiceRoleAllowed } from "@/lib/supabaseAuthenticated";
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
  assertServiceRoleAllowed("src/lib/crm/enrollmentEngine.ts — service-role module; internal/background operations only");
  const supabase = getServiceClient();
  const { data, error } = await supabase.rpc("enroll_student", {
    p_tenant_id:         tenantId,
    p_student_id:        input.studentId,
    p_teacher_id:        input.teacherId,
    p_start_date:        input.startDate ?? null,
    p_enrollment_status: input.status ?? "active",
  });
  if (error) throw new Error(error.message);
  return (data as { enrollment: Enrollment }).enrollment;
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
