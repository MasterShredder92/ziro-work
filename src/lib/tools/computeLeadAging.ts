import type { AgentContext } from "../agents/types";
import type { InactivityBucket, Lead } from "../types/leads";
import { getTenantSettings } from "./getTenantSettings";

export async function computeLeadAging(
  ctx: AgentContext,
  lead: Lead
): Promise<{
  inactivity_bucket: InactivityBucket;
  days_since_last_contact: number;
}> {
  const settings = await getTenantSettings(ctx);
  const lp = settings.lead_pipeline;
  const deadAfter = lp.dead_after_days ?? 21;
  const staleAfter = lp.stale_after_days ?? 7;
  const freshMax = lp.fresh_max_days ?? 2;

  const now = new Date();
  const last = lead.last_contacted_at
    ? new Date(lead.last_contacted_at)
    : new Date(lead.created_at);

  const diffMs = now.getTime() - last.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  let bucket: InactivityBucket = "fresh";
  if (days < freshMax) bucket = "fresh";
  else if (days < staleAfter) bucket = "warm";
  else if (days < deadAfter) bucket = "cold";
  else bucket = "dead";

  return {
    inactivity_bucket: bucket,
    days_since_last_contact: days,
  };
}
