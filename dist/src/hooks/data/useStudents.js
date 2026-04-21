import { useCallback } from "react";
import { getSupabaseTenant } from "@/lib/data/supabaseTenant";
import { listStudents } from "@/lib/data/students";
import { useFacadeQuery } from "./useFacadeQuery";
export function useStudents(params, options) {
    const query = useCallback(async () => {
        const client = getSupabaseTenant(params.tenantId);
        return listStudents(client, params);
    }, [params]);
    return useFacadeQuery(["students", params], query, options);
}
