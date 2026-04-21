import { useCallback } from "react";
import { getSupabaseTenant } from "@/lib/data/supabaseTenant";
import { getTenantSettingsByTenantId } from "@/lib/data/tenantSettings";
import { useFacadeQuery } from "./useFacadeQuery";
export function useTenantSettings(tenantId) {
    const query = useCallback(async () => {
        const client = getSupabaseTenant(tenantId);
        return getTenantSettingsByTenantId(client, tenantId);
    }, [tenantId]);
    return useFacadeQuery(["tenant_settings", tenantId], query);
}
