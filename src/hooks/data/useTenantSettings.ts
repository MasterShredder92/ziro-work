import { useCallback } from "react";
import { getSupabaseTenant } from "@/lib/data/supabaseTenant";
import { getTenantSettingsByTenantId, type TenantSettingsRow } from "@/lib/data/tenantSettings";
import type { FacadeResult } from "@/lib/data/core";
import { useFacadeQuery } from "./useFacadeQuery";

export function useTenantSettings(tenantId: string) {
  const query = useCallback(async (): Promise<FacadeResult<TenantSettingsRow | null>> => {
    const client = getSupabaseTenant(tenantId);
    return getTenantSettingsByTenantId(client, tenantId);
  }, [tenantId]);

  return useFacadeQuery(["tenant_settings", tenantId], query);
}
