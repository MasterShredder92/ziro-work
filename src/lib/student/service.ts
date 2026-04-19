import "server-only";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import {
  getStudentBilling,
  getStudentLessons,
  getStudentMessages,
  getStudentProfile,
  getStudentSchedule,
} from "./queries";
import type { StudentDashboardData } from "./types";

export async function getStudentDashboard(
  studentId: string,
): Promise<StudentDashboardData> {
  const student = await getStudentProfile(studentId);
  const tenantId =
    ((student as unknown as Record<string, unknown> | null)?.[
      "tenant_id"
    ] as string | undefined) ?? DEFAULT_TENANT_ID;

  const [schedule, lessons, messages, billing] = await Promise.all([
    getStudentSchedule(studentId, tenantId),
    getStudentLessons(studentId, tenantId),
    getStudentMessages(studentId, tenantId),
    getStudentBilling(studentId, tenantId),
  ]);

  return {
    student,
    schedule,
    lessons,
    messages,
    billing: billing.items,
    billingSummary: billing.summary,
    payments: billing.payments,
    generatedAt: new Date().toISOString(),
  };
}
