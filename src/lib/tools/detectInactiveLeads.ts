import type { AgentContext } from "../agents/types";
import type { Lead } from "../types/leads";
import { computeLeadAging } from "./computeLeadAging";

export async function detectInactiveLeads(ctx: AgentContext): Promise<
  {
    lead_id: string;
    inactivity_bucket: "fresh" | "warm" | "cold" | "dead";
    days_since_last_contact: number;
  }[]
> {
  const { data, error } = await ctx.supabase
    .from("leads")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .neq("status", "lost")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) throw error;
  const leads = (data ?? []) as Lead[];

  const out: {
    lead_id: string;
    inactivity_bucket: "fresh" | "warm" | "cold" | "dead";
    days_since_last_contact: number;
  }[] = [];
  for (const lead of leads) {
    const aging = await computeLeadAging(ctx, lead);
    if (aging.inactivity_bucket === "cold" || aging.inactivity_bucket === "dead") {
      out.push({
        lead_id: lead.id,
        inactivity_bucket: aging.inactivity_bucket,
        days_since_last_contact: aging.days_since_last_contact,
      });
    }
  }
  return out;
}

