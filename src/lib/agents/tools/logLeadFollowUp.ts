import { registerTool } from "../tools";

registerTool({
  name: "log_lead_follow_up",
  run: async ({ leadId, tenantId, reason }, ctx) => {
    const row: Record<string, unknown> = {
      lead_id: leadId,
      tenant_id: tenantId,
      timestamp: new Date().toISOString(),
    };
    if (reason !== undefined) row.reason = reason;

    const { error } = await ctx.supabase.from("lead_followups").insert(row);

    if (error) throw error;
    return { success: true };
  },
});

