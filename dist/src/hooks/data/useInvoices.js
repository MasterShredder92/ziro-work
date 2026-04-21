import { useCallback } from "react";
import { getSupabaseTenant } from "@/lib/data/supabaseTenant";
import { listInvoices } from "@/lib/data/invoices";
import { useFacadeQuery } from "./useFacadeQuery";
export function useInvoices(params, options) {
    const query = useCallback(async () => {
        const client = getSupabaseTenant(params.tenantId);
        return listInvoices(client, params);
    }, [params]);
    return useFacadeQuery(["invoices", params], query, options);
}
