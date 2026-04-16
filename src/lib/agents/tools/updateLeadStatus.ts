import { registerTool } from "../tools";

registerTool({
  name: "update_lead_status",
  run: async ({ leadId, status, tenantId, last_contacted_at, inactivity_bucket }, ctx) => {
    const patch: Record<string, unknown> = { status };
    if (last_contacted_at !== undefined) patch.last_contacted_at = last_contacted_at;
    if (inactivity_bucket !== undefined) patch.inactivity_bucket = inactivity_bucket;

    const { error } = await ctx.supabase
      .from("leads")
      .update(patch)
      .eq("id", leadId)
      .eq("tenant_id", tenantId);

    if (error) throw error;
    return { success: true };
  },
});

