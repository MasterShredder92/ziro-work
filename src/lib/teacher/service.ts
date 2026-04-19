import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import {
  getTeacherLessons,
  getTeacherMessages,
  getTeacherProfile,
  getTeacherSchedule,
  getTeacherStudents,
} from "./queries";
import type { TeacherDashboardData } from "./types";

export async function getTeacherDashboard(
  teacherId: string,
): Promise<TeacherDashboardData> {
  const teacher = await getTeacherProfile(teacherId);
  const tenantId =
    (teacher?.tenant_id as string | undefined) ?? DEFAULT_TENANT_ID;

  const [schedule, students, lessons, messages] = await Promise.all([
    getTeacherSchedule(teacherId, tenantId),
    getTeacherStudents(teacherId, tenantId),
    getTeacherLessons(teacherId, tenantId),
    getTeacherMessages(teacherId, tenantId),
  ]);

  return { teacher, schedule, students, lessons, messages };
}
