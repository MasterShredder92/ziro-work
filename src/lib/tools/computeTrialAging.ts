import type { AgentContext } from "../agents/types";
import type { Trial } from "../types/trials";

export async function computeTrialAging(_ctx: AgentContext, trial: Trial): Promise<{
  inactivity_bucket: "fresh" | "upcoming" | "stale" | "dead";
  days_since_trial: number;
}> {
  const now = new Date();
  const when = new Date(trial.scheduled_at ?? trial.time ?? "");
  const days =
    Number.isFinite(when.getTime())
      ? Math.floor((now.getTime() - when.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

  // Upcoming: in the future
  if (Number.isFinite(when.getTime()) && when.getTime() > now.getTime()) {
    return { inactivity_bucket: "upcoming", days_since_trial: Math.abs(days) };
  }

  let inactivity_bucket: "fresh" | "upcoming" | "stale" | "dead" = "fresh";
  const safeDays = Math.max(0, days);
  if (safeDays >= 14) inactivity_bucket = "dead";
  else if (safeDays >= 7) inactivity_bucket = "stale";

  return { inactivity_bucket, days_since_trial: safeDays };
}

