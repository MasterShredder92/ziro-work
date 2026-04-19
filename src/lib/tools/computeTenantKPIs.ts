import type { AgentContext } from "../agents/types";

export async function computeTenantKPIs(ctx: AgentContext): Promise<{
  leadsThisWeek: number;
  trialsScheduled: number;
  activeStudents: number;
}> {
  const tenantId = ctx.tenantId;
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [{ count: leadsThisWeek }, { count: trialsScheduled }, { count: activeStudents }] =
    await Promise.all([
      ctx.supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .gte("created_at", weekAgo),
      ctx.supabase
        .from("trials")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .in("status", ["scheduled", "confirmed"]),
      ctx.supabase
        .from("students")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("status", "active"),
    ]);

  return {
    leadsThisWeek: leadsThisWeek ?? 0,
    trialsScheduled: trialsScheduled ?? 0,
    activeStudents: activeStudents ?? 0,
  };
}

