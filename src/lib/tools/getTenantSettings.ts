import type { AgentContext } from "../agents/types";
import type { MergedTenantSettings } from "../types/tenantSettings";

const DEFAULTS: Omit<MergedTenantSettings, "tenant_id"> = {
  lead_pipeline: { dead_after_days: 21, stale_after_days: 7, fresh_max_days: 2 },
  trial_pipeline: { dead_after_days: 7, fresh_max_days: 1 },
  retention_pipeline: { warning_threshold: 1, risk_threshold: 3 },
  kpi_settings: { lead_weight: 1, trial_weight: 2, student_weight: 3 },
  schedule: { dashboard_tick_ms: 60_000 },
  pipelines: { lead: true, trial: true, enrollment: true, retention: true },
  events: { disabled: [] },
  enrollment_pipeline: {},
};

function mergeJson<T extends Record<string, unknown>>(base: T, patch: unknown): T {
  if (!patch || typeof patch !== "object") return { ...base };
  return { ...base, ...(patch as T) };
}

export async function getTenantSettings(ctx: AgentContext): Promise<MergedTenantSettings> {
  const { data, error } = await ctx.supabase
    .from("tenant_settings")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .maybeSingle();

  if (error) throw error;

  const row = (data ?? {}) as Record<string, unknown>;

  return {
    ...DEFAULTS,
    ...row,
    lead_pipeline: mergeJson(DEFAULTS.lead_pipeline, row.lead_pipeline),
    trial_pipeline: mergeJson(DEFAULTS.trial_pipeline, row.trial_pipeline),
    retention_pipeline: mergeJson(DEFAULTS.retention_pipeline, row.retention_pipeline),
    kpi_settings: mergeJson(DEFAULTS.kpi_settings, row.kpi_settings),
    schedule: mergeJson(DEFAULTS.schedule, row.schedule),
    pipelines: mergeJson(DEFAULTS.pipelines, row.pipelines) as MergedTenantSettings["pipelines"],
    events: mergeJson(DEFAULTS.events as Record<string, unknown>, row.events) as MergedTenantSettings["events"],
    enrollment_pipeline: mergeJson(
      DEFAULTS.enrollment_pipeline as Record<string, unknown>,
      row.enrollment_pipeline
    ),
  } as MergedTenantSettings;
}
