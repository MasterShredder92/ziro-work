import type { AgentContext } from "../agents/types";
import type { Trial } from "../types/trials";

export async function detectTrialToEnrollment(ctx: AgentContext) {
  const trials: Trial[] = await ctx.tools.get_trials({ tenantId: ctx.tenantId });

  const ready: { trial_id: string; lead_id: string }[] = [];

  for (const trial of trials) {
    if (trial.status === "completed" && trial.attended === true && trial.lead_id) {
      ready.push({
        trial_id: trial.id,
        lead_id: trial.lead_id,
      });
    }
  }

  return ready;
}
