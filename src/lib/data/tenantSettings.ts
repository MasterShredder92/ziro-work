import type { DbClient, FacadeResult } from "./core";
import { toErrorInfo } from "./core";
import { getServiceClient } from "@/lib/supabase";
import { assertServiceRoleAllowed } from "@/lib/supabaseAuthenticated";

/** Row shape for `tenant_settings` (read-only UI consumption). */
export type TenantSettingsRow = {
  tenant_id: string;
  lead_pipeline: unknown;
  trial_pipeline: unknown;
  enrollment_pipeline: unknown;
  retention_pipeline: unknown;
  kpi_settings: unknown;
  schedule: unknown;
  pipelines: unknown;
  events: unknown;
  created_at: string;
  updated_at: string;
};

export async function getTenantSettingsByTenantId(
  client: DbClient,
  tenantId: string
): Promise<FacadeResult<TenantSettingsRow | null>> {
  try {
    const { data, error } = await client
      .from("tenant_settings")
      .select("*")
      .eq("tenant_id", tenantId)
      .maybeSingle();
    if (error) return { data: null, error: toErrorInfo(error) };
    return { data: (data ?? null) as TenantSettingsRow | null, error: null };
  } catch (err) {
    return { data: null, error: toErrorInfo(err) };
  }
}

/**
 * Fetch tenant settings by tenant ID using the service client.
 * Used by the admin settings layer (no DbClient injection needed).
 */
export async function getTenantSettings(tenantId: string): Promise<TenantSettingsRow> {
  assertServiceRoleAllowed("src/lib/data/tenantSettings.ts — service-role module; internal/background operations only");
  const db = getServiceClient();
  const { data, error } = await db
    .from("tenant_settings")
    .select("*")
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) {
    return {
      tenant_id: tenantId,
      lead_pipeline: null,
      trial_pipeline: null,
      enrollment_pipeline: null,
      retention_pipeline: null,
      kpi_settings: null,
      schedule: null,
      pipelines: null,
      events: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
  return data as TenantSettingsRow;
}

/**
 * Update (upsert) tenant settings for a given tenant.
 * Merges the patch into the existing JSONB fields.
 */
export async function updateTenantSettings(
  tenantId: string,
  patch: Partial<TenantSettingsRow> & { updated_by?: string }
): Promise<TenantSettingsRow> {
  const db = getServiceClient();
  const current = await getTenantSettings(tenantId);

  function mergeJson(existing: unknown, incoming: unknown): unknown {
    if (
      incoming !== null &&
      incoming !== undefined &&
      typeof incoming === "object" &&
      !Array.isArray(incoming) &&
      existing !== null &&
      existing !== undefined &&
      typeof existing === "object" &&
      !Array.isArray(existing)
    ) {
      return { ...(existing as Record<string, unknown>), ...(incoming as Record<string, unknown>) };
    }
    return incoming !== undefined ? incoming : existing;
  }

  const merged: Record<string, unknown> = {
    tenant_id: tenantId,
    lead_pipeline: mergeJson(current.lead_pipeline, patch.lead_pipeline),
    trial_pipeline: mergeJson(current.trial_pipeline, patch.trial_pipeline),
    enrollment_pipeline: mergeJson(current.enrollment_pipeline, patch.enrollment_pipeline),
    retention_pipeline: mergeJson(current.retention_pipeline, patch.retention_pipeline),
    kpi_settings: mergeJson(current.kpi_settings, patch.kpi_settings),
    schedule: mergeJson(current.schedule, patch.schedule),
    pipelines: mergeJson(current.pipelines, patch.pipelines),
    events: mergeJson(current.events, patch.events),
    updated_at: new Date().toISOString(),
    updated_by: patch.updated_by ?? null,
  };

  const { data, error } = await db
    .from("tenant_settings")
    .upsert(merged, { onConflict: "tenant_id" })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as TenantSettingsRow;
}
