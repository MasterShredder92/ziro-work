import { registerTool } from "../tools";

registerTool({
  name: "get_leads",
  run: async ({ tenantId, filter }, ctx) => {
    let q = ctx.supabase
      .from("leads")
      .select("*")
      .eq("tenant_id", tenantId);

    if (filter?.id) {
      q = q.eq("id", filter.id);
    }

    const { data, error } = await q.order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },
});

