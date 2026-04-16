import { registerTool } from "../tools";

registerTool({
  name: "update_trial_status",
  run: async (
    {
      trialId,
      trial_id,
      tenantId,
      status,
      last_reminded_at,
      inactivity_bucket,
      attended,
      enrollment_decision,
    },
    ctx
  ) => {
    const id = trialId ?? trial_id;
    const patch: Record<string, unknown> = {};
    if (status !== undefined) patch.status = status;
    if (last_reminded_at !== undefined) patch.last_reminded_at = last_reminded_at;
    if (inactivity_bucket !== undefined) patch.inactivity_bucket = inactivity_bucket;
    if (attended !== undefined) patch.attended = attended;
    if (enrollment_decision !== undefined) patch.enrollment_decision = enrollment_decision;

    const { error } = await ctx.supabase.from("trials").update(patch).eq("id", id).eq("tenant_id", tenantId);

    if (error) throw error;
    return { success: true };
  },
});
