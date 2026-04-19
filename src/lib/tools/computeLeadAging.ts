import type { AgentContext } from "../agents/types";
import type { Lead } from "../types/leads";

export async function computeLeadAging(_ctx: AgentContext, lead: Lead): Promise<{
  inactivity_bucket: "fresh" | "warm" | "cold" | "dead";
  days_since_last_contact: number;
}> {
  const now = new Date();
  const base = lead.last_contacted_at ?? lead.created_at;
  const d = new Date(base);
  const days =
    Number.isFinite(d.getTime())
      ? Math.max(0, Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

  let inactivity_bucket: "fresh" | "warm" | "cold" | "dead" = "fresh";
  if (days >= 14) inactivity_bucket = "dead";
  else if (days >= 7) inactivity_bucket = "cold";
  else if (days >= 2) inactivity_bucket = "warm";

  return { inactivity_bucket, days_since_last_contact: days };
}

