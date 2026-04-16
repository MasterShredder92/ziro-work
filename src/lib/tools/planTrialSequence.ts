import type { AgentContext } from "../agents/types";
import type { Trial } from "../types/trials";
import { computeTrialAging } from "./computeTrialAging";

export type TrialSequencePlan = {
  next_action_type: "confirm" | "follow_up" | "final_nudge" | "mark_lost";
  template_id: string | null;
};

export async function planTrialSequence(ctx: AgentContext, trial: Trial): Promise<TrialSequencePlan> {
  const aging = await computeTrialAging(ctx, trial);

  if (trial.status === "completed") {
    return {
      next_action_type: "follow_up",
      template_id: "post_trial_enrollment_nudge",
    };
  }

  if (trial.status === "scheduled" && aging.inactivity_bucket === "dead") {
    return {
      next_action_type: "mark_lost",
      template_id: null,
    };
  }

  if (trial.status === "scheduled") {
    return {
      next_action_type: "confirm",
      template_id: "trial_confirmation",
    };
  }

  if (aging.inactivity_bucket === "dead") {
    return {
      next_action_type: "mark_lost",
      template_id: null,
    };
  }

  return {
    next_action_type: "final_nudge",
    template_id: "trial_final_nudge",
  };
}
