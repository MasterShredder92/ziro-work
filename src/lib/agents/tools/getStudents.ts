import { registerTool } from "../tools";

registerTool({
  name: "get_students",
  run: async ({ tenantId, filter }, ctx) => {
    let q = ctx.supabase.from("students").select("*").eq("tenant_id", tenantId);

    if (filter?.id) {
      q = q.eq("id", filter.id);
    }

    const { data, error } = await q;

    if (error) throw error;
    return data || [];
  },
});

