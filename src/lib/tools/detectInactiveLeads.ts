import type { AgentContext } from "../agents/types";
import type { InactivityBucket, Lead } from "../types/leads";
import { computeLeadAging } from "./computeLeadAging";

export async function detectInactiveLeads(ctx: AgentContext) {
  const leads: Lead[] = await ctx.tools.get_leads({ tenantId: ctx.tenantId });

  const inactive: {
    lead_id: string;
    inactivity_bucket: InactivityBucket;
    days_since_last_contact: number;
  }[] = [];

  for (const lead of leads) {
    const aging = await computeLeadAging(ctx, lead);

    if (aging.inactivity_bucket === "cold" || aging.inactivity_bucket === "dead") {
      inactive.push({
        lead_id: lead.id,
        inactivity_bucket: aging.inactivity_bucket,
        days_since_last_contact: aging.days_since_last_contact,
      });
    }
  }

  return inactive;
}
