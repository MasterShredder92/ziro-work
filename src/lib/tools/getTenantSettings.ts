import type { AgentContext } from "../agents/types";

/**
 * Minimal tenant settings loader.
 * Returns a stable shape with defaults when no row exists.
 */
export async function getTenantSettings(ctx: AgentContext): Promise<Record<string, unknown>> {
  const tenantId = ctx.tenantId;
  if (!tenantId) return { pipelines: {}, retention_pipeline: {}, events: { disabled: [] }, schedule: {} };

  const { data, error } = await ctx.supabase
    .from("tenant_settings")
    .select("*")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error) {
    // Best-effort: callers expect settings to exist; do not throw for missing table/row during early boot.
    return { pipelines: {}, retention_pipeline: {}, events: { disabled: [] }, schedule: {} };
  }

  const row = data ?? {};
  return {
    pipelines: row.pipelines ?? {},
    retention_pipeline: row.retention_pipeline ?? {},
    events: row.events ?? { disabled: [] },
    schedule: row.schedule ?? {},
    ...row,
  };
}

