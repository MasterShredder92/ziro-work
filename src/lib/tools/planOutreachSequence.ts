import type { AgentContext } from "../agents/types";
import type { Lead } from "../types/leads";
import { computeLeadAging } from "./computeLeadAging";

export type OutreachPlan = {
  next_action_type: "follow_up" | "final_nudge" | "mark_lost";
  template_id: string | null;
};

export async function planOutreachSequence(ctx: AgentContext, lead: Lead): Promise<OutreachPlan> {
  if (lead.status === "new") {
    return {
      next_action_type: "follow_up",
      template_id: "lead_follow_up_generic",
    };
  }

  if (lead.status === "contacted") {
    const aging = await computeLeadAging(ctx, lead);

    if (aging.inactivity_bucket === "dead") {
      return {
        next_action_type: "mark_lost",
        template_id: null,
      };
    }

    return {
      next_action_type: "follow_up",
      template_id: "lead_follow_up_generic",
    };
  }

  if (lead.status === "trial_scheduled") {
    return {
      next_action_type: "follow_up",
      template_id: "post_trial_nudge",
    };
  }

  return {
    next_action_type: "mark_lost",
    template_id: null,
  };
}
