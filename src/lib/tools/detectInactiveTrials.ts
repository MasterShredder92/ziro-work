import type { AgentContext } from "../agents/types";
import type { Trial } from "../types/trials";
import { computeTrialAging } from "./computeTrialAging";

export async function detectInactiveTrials(ctx: AgentContext): Promise<
  {
    trial_id: string;
    lead_id: string | null;
    inactivity_bucket: "fresh" | "upcoming" | "stale" | "dead";
    days_since_trial: number;
  }[]
> {
  const { data, error } = await ctx.supabase
    .from("trials")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .in("status", ["scheduled", "confirmed"])
    .order("scheduled_at", { ascending: true })
    .limit(500);

  if (error) throw error;
  const trials = (data ?? []) as Trial[];

  const out: {
    trial_id: string;
    lead_id: string | null;
    inactivity_bucket: "fresh" | "upcoming" | "stale" | "dead";
    days_since_trial: number;
  }[] = [];
  for (const trial of trials) {
    const aging = await computeTrialAging(ctx, trial);
    if (aging.inactivity_bucket === "stale" || aging.inactivity_bucket === "dead") {
      out.push({
        trial_id: trial.id,
        lead_id: trial.lead_id,
        inactivity_bucket: aging.inactivity_bucket,
        days_since_trial: aging.days_since_trial,
      });
    }
  }
  return out;
}

