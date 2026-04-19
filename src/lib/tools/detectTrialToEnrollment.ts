import type { AgentContext } from "../agents/types";

/**
 * Detect trials that should be converted to enrollments.
 * Conservative: requires status "completed" and a lead_id.
 */
export async function detectTrialToEnrollment(ctx: AgentContext): Promise<
  { trial_id: string; lead_id: string }[]
> {
  const { data, error } = await ctx.supabase
    .from("trials")
    .select("id,lead_id,status,enrollment_decision")
    .eq("tenant_id", ctx.tenantId)
    .eq("status", "completed")
    .neq("lead_id", null)
    .order("scheduled_at", { ascending: false })
    .limit(200);

  if (error) throw error;
  const out: { trial_id: string; lead_id: string }[] = [];
  for (const row of (data ?? []) as Record<string, unknown>[]) {
    const decision = (row.enrollment_decision as string | null | undefined) ?? null;
    if (decision && decision.toLowerCase() === "no") continue;
    out.push({ trial_id: row.id as string, lead_id: row.lead_id as string });
  }
  return out;
}

