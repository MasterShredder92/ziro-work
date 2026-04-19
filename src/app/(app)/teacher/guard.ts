import "server-only";
import { assertTenantAccess, requireRole } from "@/lib/auth/guards";
import type { Session } from "@/lib/auth/session";
import { getTeacherByProfileId, getTeacherProfile } from "@/lib/teacher/queries";
import type { Teacher } from "@data/teachers";

export async function ensureTeacherAccess(): Promise<Session> {
  return requireRole("teacher")();
}

export type TeacherContext = {
  session: Session;
  teacher: Teacher;
  teacherId: string;
  tenantId: string;
};

export async function resolveTeacherContext(options?: {
  teacherId?: string | null;
}): Promise<TeacherContext> {
  const session = await requireRole("teacher")();

  let teacher: Teacher | null = null;
  const explicitId = options?.teacherId?.trim();

  if (explicitId) {
    teacher = await getTeacherProfile(explicitId);
  } else {
    teacher = await getTeacherByProfileId(session.userId);
    if (!teacher) teacher = await getTeacherProfile(session.userId);
  }

  if (!teacher) {
    throw new Error("TEACHER_NOT_FOUND");
  }

  const teacherTenant = (teacher.tenant_id as string | undefined) ?? "";
  await assertTenantAccess(teacherTenant);

  if (
    session.role === "teacher" &&
    teacher.profile_id &&
    teacher.profile_id !== session.userId
  ) {
    throw new Error("FORBIDDEN");
  }

  return {
    session,
    teacher,
    teacherId: teacher.id,
    tenantId: teacherTenant,
  };
}
