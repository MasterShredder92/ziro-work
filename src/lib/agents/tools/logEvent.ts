import { registerTool } from "../tools";

registerTool({
  name: "log_event",
  run: async ({ type, payload, tenantId }, ctx) => {
    const { error } = await ctx.supabase.from("events").insert({
      type,
      payload,
      tenant_id: tenantId,
      timestamp: new Date().toISOString(),
    });

    if (error) throw error;
    return { success: true };
  },
});

