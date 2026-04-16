import type { AgentContext } from "../agents/types";
import { getTenantSettings } from "./getTenantSettings";

export async function computeTenantKPIs(ctx: AgentContext) {
  const settings = await getTenantSettings(ctx);

  const base = await ctx.tools.get_kpis({ tenantId: ctx.tenantId });
  const leads = await ctx.tools.get_leads({ tenantId: ctx.tenantId });
  const trials = await ctx.tools.get_trials({ tenantId: ctx.tenantId });
  const students = await ctx.tools.get_students({ tenantId: ctx.tenantId });

  const kw = settings.kpi_settings;
  const leadWeight = kw.lead_weight ?? 1;
  const trialWeight = kw.trial_weight ?? 2;
  const studentWeight = kw.student_weight ?? 3;

  const score =
    (leads?.length ?? 0) * leadWeight +
    (trials?.length ?? 0) * trialWeight +
    (students?.length ?? 0) * studentWeight;

  return {
    ...base,
    score,
    tenantKpiWeights: { leadWeight, trialWeight, studentWeight },
  };
}
