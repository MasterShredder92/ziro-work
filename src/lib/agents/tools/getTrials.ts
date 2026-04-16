import { registerTool } from "../tools";

function normalizeTrialRow(row: Record<string, unknown>) {
  const scheduledAt = (row.scheduled_at as string | null | undefined) ?? (row.time as string | null | undefined);
  return {
    ...row,
    scheduled_at: scheduledAt ?? "",
    lead_id: (row.lead_id as string | null | undefined) ?? null,
    last_reminded_at: (row.last_reminded_at as string | null | undefined) ?? null,
    status: (row.status as string | undefined) ?? "scheduled",
    inactivity_bucket: (row.inactivity_bucket as string | null | undefined) ?? null,
    attended: (row.attended as boolean | null | undefined) ?? null,
    enrollment_decision: (row.enrollment_decision as string | null | undefined) ?? null,
  };
}

registerTool({
  name: "get_trials",
  run: async ({ tenantId, filter }, ctx) => {
    let q = ctx.supabase.from("trials").select("*").eq("tenant_id", tenantId);

    if (filter?.id) {
      q = q.eq("id", filter.id);
    }

    const { data, error } = await q.order("time", { ascending: true });

    if (error) throw error;
    return (data || []).map((r: Record<string, unknown>) => normalizeTrialRow(r));
  },
});

