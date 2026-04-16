import type { AgentContext } from "../agents/types";
import type { Trial, TrialInactivityBucket } from "../types/trials";
import { getTenantSettings } from "./getTenantSettings";

function trialScheduledAt(trial: Trial): string {
  return trial.scheduled_at || (trial.time as string) || new Date(0).toISOString();
}

export async function computeTrialAging(
  ctx: AgentContext,
  trial: Trial
): Promise<{
  inactivity_bucket: TrialInactivityBucket;
  days_since_trial: number;
}> {
  const settings = await getTenantSettings(ctx);
  const tp = settings.trial_pipeline;
  const deadAfter = tp.dead_after_days ?? 7;
  const freshMax = tp.fresh_max_days ?? 1;

  const now = new Date();
  const scheduled = new Date(trialScheduledAt(trial));

  const diffMs = now.getTime() - scheduled.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  let bucket: TrialInactivityBucket = "fresh";

  if (days < 0) bucket = "upcoming";
  else if (days <= freshMax) bucket = "fresh";
  else if (days < deadAfter) bucket = "stale";
  else bucket = "dead";

  return {
    inactivity_bucket: bucket,
    days_since_trial: days,
  };
}
