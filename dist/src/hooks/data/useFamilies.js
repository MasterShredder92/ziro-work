import { useCallback } from "react";
import { getSupabaseTenant } from "@/lib/data/supabaseTenant";
import { listFamilies } from "@/lib/data/families";
import { useFacadeQuery } from "./useFacadeQuery";
export function useFamilies(params, options) {
    const query = useCallback(async () => {
        const client = getSupabaseTenant(params.tenantId);
        return listFamilies(client, params);
    }, [params]);
    return useFacadeQuery(["families", params], query, options);
}
