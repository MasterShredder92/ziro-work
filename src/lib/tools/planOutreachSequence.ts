import type { AgentContext } from "../agents/types";
import type { Lead } from "../types/leads";
import { computeLeadAging } from "./computeLeadAging";

export type OutreachPlan = {
  next_action_type: "follow_up" | "final_nudge" | "mark_lost" | "none";
  template_id: string | null;
};

export async function planOutreachSequence(ctx: AgentContext, lead: Lead): Promise<OutreachPlan> {
  const aging = await computeLeadAging(ctx, lead);
  if (aging.inactivity_bucket === "dead") {
    return { next_action_type: "mark_lost", template_id: null };
  }
  if (aging.inactivity_bucket === "cold") {
    return { next_action_type: "final_nudge", template_id: "lead_final_nudge" };
  }
  if (aging.inactivity_bucket === "warm") {
    return { next_action_type: "follow_up", template_id: "lead_follow_up" };
  }
  return { next_action_type: "none", template_id: null };
}

