import { registerTool } from "../tools";

registerTool({
  name: "schedule_trial",
  run: async ({ studentId, time, tenantId }, ctx) => {
    const { error } = await ctx.supabase.from("trials").insert({
      student_id: studentId,
      time,
      scheduled_at: time,
      tenant_id: tenantId,
      status: "scheduled",
    });

    if (error) throw error;
    return { success: true };
  },
});

