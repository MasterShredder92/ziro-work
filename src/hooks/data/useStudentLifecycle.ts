import { useCallback } from "react";
import { getSupabaseTenant } from "@/lib/data/supabaseTenant";
import {
  listStudentLifecycle,
  type ListStudentLifecycleParams,
} from "@/lib/data/studentLifecycle";
import type { FacadeResult, ListResult } from "@/lib/data/core";
import type { StudentLifecycleEntry } from "@/lib/data/models";
import { useFacadeQuery } from "./useFacadeQuery";

export function useStudentLifecycle(params: ListStudentLifecycleParams) {
  const query = useCallback(
    async (): Promise<FacadeResult<ListResult<StudentLifecycleEntry>>> => {
      const client = getSupabaseTenant(params.tenantId);
      return listStudentLifecycle(client, params);
    },
    [params]
  );

  return useFacadeQuery(["student_lifecycle", params], query);
}

