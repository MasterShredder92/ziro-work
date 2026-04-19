import { useCallback } from "react";
import { getSupabaseTenant } from "@/lib/data/supabaseTenant";
import { listFamilies, type ListFamiliesParams } from "@/lib/data/families";
import type { FacadeResult } from "@/lib/data/core";
import type { ListResult } from "@/lib/data/core";
import type { Family } from "@/lib/data/models";
import { useFacadeQuery } from "./useFacadeQuery";

export function useFamilies(
  params: ListFamiliesParams,
  options?: { enabled?: boolean },
) {
  const query = useCallback(async (): Promise<FacadeResult<ListResult<Family>>> => {
    const client = getSupabaseTenant(params.tenantId);
    return listFamilies(client, params);
  }, [params]);

  return useFacadeQuery(["families", params], query, options);
}

