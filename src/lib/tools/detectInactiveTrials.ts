import type { AgentContext } from "../agents/types";
import type { Trial, TrialInactivityBucket } from "../types/trials";
import { computeTrialAging } from "./computeTrialAging";

export async function detectInactiveTrials(ctx: AgentContext) {
  const trials: Trial[] = await ctx.tools.get_trials({ tenantId: ctx.tenantId });

  const inactive: {
    trial_id: string;
    lead_id: string | null;
    inactivity_bucket: TrialInactivityBucket;
    days_since_trial: number;
  }[] = [];

  for (const trial of trials) {
    const aging = await computeTrialAging(ctx, trial);

    if (aging.inactivity_bucket === "stale" || aging.inactivity_bucket === "dead") {
      inactive.push({
        trial_id: trial.id,
        lead_id: trial.lead_id ?? null,
        inactivity_bucket: aging.inactivity_bucket,
        days_since_trial: aging.days_since_trial,
      });
    }
  }

  return inactive;
}
