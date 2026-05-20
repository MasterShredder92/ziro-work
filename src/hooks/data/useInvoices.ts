import { useCallback } from "react";
import { getSupabaseTenant } from "@/lib/data/supabaseTenant";
import { listInvoices, type ListInvoicesParams } from "@/lib/data/invoices";
import type { FacadeResult, ListResult } from "@/lib/data/core";
import type { Invoice } from "@/lib/data/models";
import { useFacadeQuery } from "./useFacadeQuery";

export function useInvoices(
  params: ListInvoicesParams,
  options?: { enabled?: boolean }
) {
  const query = useCallback(async (): Promise<FacadeResult<ListResult<Invoice>>> => {
    const client = await getSupabaseTenant(params.tenantId);
    return listInvoices(client, params);
  }, [params]);

  return useFacadeQuery(["invoices", params], query, options);
}

