import { registerTool } from "../tools";

registerTool({
  name: "update_student",
  run: async (
    {
      studentId,
      student_id,
      tenantId,
      onboarding_stage,
      last_attendance_at,
      enrollment_date,
      attendance_streak,
      churn_risk,
    },
    ctx
  ) => {
    const id = studentId ?? student_id;
    const patch: Record<string, unknown> = {};
    if (onboarding_stage !== undefined) patch.onboarding_stage = onboarding_stage;
    if (last_attendance_at !== undefined) patch.last_attendance_at = last_attendance_at;
    if (enrollment_date !== undefined) patch.enrollment_date = enrollment_date;
    if (attendance_streak !== undefined) patch.attendance_streak = attendance_streak;
    if (churn_risk !== undefined) patch.churn_risk = churn_risk;

    const { error } = await ctx.supabase.from("students").update(patch).eq("id", id).eq("tenant_id", tenantId);

    if (error) throw error;
    return { success: true };
  },
});
