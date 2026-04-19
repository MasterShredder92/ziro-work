import type { AgentContext } from "../agents/types";
import type { Trial } from "../types/trials";
import { computeTrialAging } from "./computeTrialAging";

export type TrialPlan = {
  next_action_type: "confirm" | "follow_up" | "final_nudge" | "mark_lost" | "none";
  template_id: string | null;
};

export async function planTrialSequence(ctx: AgentContext, trial: Trial): Promise<TrialPlan> {
  const aging = await computeTrialAging(ctx, trial);

  if (trial.status === "scheduled" && aging.inactivity_bucket === "upcoming") {
    return { next_action_type: "confirm", template_id: "trial_confirm" };
  }

  if (aging.inactivity_bucket === "stale") {
    return { next_action_type: "follow_up", template_id: "trial_follow_up" };
  }

  if (aging.inactivity_bucket === "dead") {
    return { next_action_type: "mark_lost", template_id: null };
  }

  return { next_action_type: "none", template_id: null };
}

