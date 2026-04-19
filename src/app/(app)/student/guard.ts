import "server-only";
import { assertTenantAccess, requireRole } from "@/lib/auth/guards";
import type { Session } from "@/lib/auth/session";
import {
  getStudentByProfileId,
  getStudentProfile,
} from "@/lib/student/queries";
import type { Student } from "@/lib/types/entities";

export async function ensureStudentAccess(): Promise<Session> {
  return requireRole("student")();
}

export type StudentContext = {
  session: Session;
  student: Student;
  studentId: string;
  tenantId: string;
};

export async function resolveStudentContext(options?: {
  studentId?: string | null;
}): Promise<StudentContext> {
  const session = await requireRole("student")();

  let student: Student | null = null;
  const explicitId = options?.studentId?.trim();

  if (explicitId) {
    student = await getStudentProfile(explicitId);
  } else {
    student = await getStudentByProfileId(session.userId);
  }

  if (!student) {
    throw new Error("STUDENT_NOT_FOUND");
  }

  const studentTenant =
    ((student as unknown as Record<string, unknown>)["tenant_id"] as
      | string
      | undefined) ?? "";
  await assertTenantAccess(studentTenant);

  if (
    session.role === "student" &&
    (student as unknown as Record<string, unknown>)["profile_id"] &&
    (student as unknown as Record<string, unknown>)["profile_id"] !==
      session.userId
  ) {
    throw new Error("FORBIDDEN");
  }

  return {
    session,
    student,
    studentId: student.id,
    tenantId: studentTenant,
  };
}
