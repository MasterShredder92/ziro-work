import type { AgentContext } from "../agents/types";
import type { Attendance } from "../types/attendance";
import type { Student } from "../types/students";
import { computeAttendanceHealth } from "./computeAttendanceHealth";

export async function detectAtRiskStudents(ctx: AgentContext) {
  const students: Student[] = await ctx.tools.get_students({ tenantId: ctx.tenantId });

  const flagged: { student_id: string; missed_in_last_30_days: number }[] = [];

  for (const student of students) {
    const { data, error } = await ctx.supabase
      .from("attendance")
      .select("*")
      .eq("tenant_id", ctx.tenantId)
      .eq("student_id", student.id);

    if (error) continue;

    const health = await computeAttendanceHealth(ctx, (data || []) as Attendance[]);
    const stage = student.onboarding_stage;

    if (health.health === "at_risk" || (health.health === "warning" && stage === "first_week")) {
      flagged.push({
        student_id: student.id,
        missed_in_last_30_days: health.missed_in_last_30_days,
      });
    }
  }

  return flagged;
}
