import type { DbClient, FacadeResult } from "./core";
import { toErrorInfo } from "./core";

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
