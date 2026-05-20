import { useCallback } from "react";
import { getSupabaseTenant } from "@/lib/data/supabaseTenant";
import { listEvents, type ListEventsParams } from "@/lib/data/events";
import type { FacadeResult, ListResult } from "@/lib/data/core";
import type { EventLog } from "@/lib/data/models";
import { useFacadeQuery } from "./useFacadeQuery";

export function useEvents(
  params: ListEventsParams,
  options?: { enabled?: boolean },
) {
  const query = useCallback(async (): Promise<FacadeResult<ListResult<EventLog>>> => {
    const client = await getSupabaseTenant(params.tenantId);
    return listEvents(client, params);
  }, [params]);

  return useFacadeQuery(["events", params], query, options);
}

