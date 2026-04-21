import { useCallback } from "react";
import { getSupabaseTenant } from "@/lib/data/supabaseTenant";
import { listEvents } from "@/lib/data/events";
import { useFacadeQuery } from "./useFacadeQuery";
export function useEvents(params, options) {
    const query = useCallback(async () => {
        const client = getSupabaseTenant(params.tenantId);
        return listEvents(client, params);
    }, [params]);
    return useFacadeQuery(["events", params], query, options);
}
