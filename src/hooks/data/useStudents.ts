import { useCallback } from "react";
import { getSupabaseTenant } from "@/lib/data/supabaseTenant";
import { listStudents, type ListStudentsParams } from "@/lib/data/students";
import type { FacadeResult, ListResult } from "@/lib/data/core";
import type { Student } from "@/lib/data/models";
import { useFacadeQuery } from "./useFacadeQuery";

export function useStudents(
  params: ListStudentsParams,
  options?: { enabled?: boolean },
) {
  const query = useCallback(async (): Promise<FacadeResult<ListResult<Student>>> => {
    const client = getSupabaseTenant(params.tenantId);
    return listStudents(client, params);
  }, [params]);

  return useFacadeQuery(["students", params], query, options);
}

