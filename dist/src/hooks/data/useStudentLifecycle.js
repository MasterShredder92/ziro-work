import { useCallback } from "react";
import { getSupabaseTenant } from "@/lib/data/supabaseTenant";
import { listStudentLifecycle, } from "@/lib/data/studentLifecycle";
import { useFacadeQuery } from "./useFacadeQuery";
export function useStudentLifecycle(params) {
    const query = useCallback(async () => {
        const client = getSupabaseTenant(params.tenantId);
        return listStudentLifecycle(client, params);
    }, [params]);
    return useFacadeQuery(["student_lifecycle", params], query);
}
