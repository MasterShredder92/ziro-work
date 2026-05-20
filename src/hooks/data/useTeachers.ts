import { useCallback } from "react";
import { getSupabaseTenant } from "@/lib/data/supabaseTenant";
import { listTeachers, type ListTeachersParams } from "@/lib/data/teachers";
import type { FacadeResult, ListResult } from "@/lib/data/core";
import type { Teacher } from "@/lib/data/models";
import { useFacadeQuery } from "./useFacadeQuery";

export function useTeachers(
  params: ListTeachersParams,
  options?: { enabled?: boolean },
) {
  const query = useCallback(async (): Promise<FacadeResult<ListResult<Teacher>>> => {
    const client = await getSupabaseTenant(params.tenantId);
    return listTeachers(client, params);
  }, [params]);

  return useFacadeQuery(["teachers", params], query, options);
}

