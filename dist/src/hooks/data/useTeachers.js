import { useCallback } from "react";
import { getSupabaseTenant } from "@/lib/data/supabaseTenant";
import { listTeachers } from "@/lib/data/teachers";
import { useFacadeQuery } from "./useFacadeQuery";
export function useTeachers(params, options) {
    const query = useCallback(async () => {
        const client = getSupabaseTenant(params.tenantId);
        return listTeachers(client, params);
    }, [params]);
    return useFacadeQuery(["teachers", params], query, options);
}
